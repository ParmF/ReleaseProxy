import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Enable JSON parse middleware
app.use(express.json());

// Main Proxy Core Handler Function
async function handleProxyStream(targetUrl: string, res: express.Response) {
  try {
    const parsedUrl = new URL(targetUrl);
    const host = parsedUrl.hostname;
    
    // Validate host safety (prevent arbitrary open proxying)
    const isSafeHost = 
      host.endsWith("github.com") || 
      host.endsWith("githubusercontent.com") || 
      host.endsWith("github-production-release-asset-2e65be.s3.amazonaws.com") || 
      host.endsWith("codeload.github.com");

    if (!isSafeHost) {
      return res.status(403).json({ error: "Access Denied: Only public GitHub release assets can be proxied." });
    }

    console.log(`[Proxying] Stream request to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "ReleaseProxy-Service/1.0",
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `GitHub mirror server returned code ${response.status}: ${response.statusText}` 
      });
    }

    // Capture response headers to match original download metadata
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentLength = response.headers.get("content-length");
    const filename = path.basename(parsedUrl.pathname) || "downloaded-asset";
    const contentDisposition = response.headers.get("content-disposition") || `attachment; filename="${filename}"`;

    res.setHeader("Content-Type", contentType);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }
    res.setHeader("Content-Disposition", contentDisposition);
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Check if body is available and stream chunk-by-chunk
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        res.write(Buffer.from(value));
      }
    } else {
      res.status(500).json({ error: "Download body stream is not available." });
    }
  } catch (err: any) {
    console.error("Proxy error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Failed to proxy connection to GitHub" });
    }
  }
}

// 1. Unified Subdomain and Path Proxy Route
// This route intercept requests made to the 'dl.' subdomain or regular paths
app.use((req, res, next) => {
  const host = req.headers.host || "";
  const isDlSubdomain = host.startsWith("dl.");

  if (isDlSubdomain) {
    console.log(`[dl. Subdomain routing] Triggered proxy handler for path: ${req.path}`);
    // Support queries such as: dl.example.com/dl?url=...
    if (req.path === "/dl" || req.path === "/api/proxy") {
      const urlQuery = req.query.url as string;
      if (urlQuery) {
        return handleProxyStream(urlQuery, res);
      }
    }
    // Alternatively, support path structure: dl.example.com/owner/repo/tag/filename?url=...
    const directUrl = req.query.url as string;
    if (directUrl) {
      return handleProxyStream(directUrl, res);
    }
  }
  next();
});

// 2. Main API: Convert GitHub Repo URL into structured version assets JSON
app.get("/api/releases", async (req, res) => {
  const repoUrl = req.query.url as string;
  if (!repoUrl) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }

  try {
    // Regex matches typical repository structures: github.com/owner/repo
    const regex = /github\.com\/([a-zA-Z0-9-][a-zA-Z0-9-]*)\/([a-zA-Z0-9._-]+)/i;
    const match = repoUrl.match(regex);
    if (!match) {
      return res.status(400).json({ error: "Invalid layout detected. Please provide a standard GitHub URL (e.g. https://github.com/user/repo)" });
    }

    const owner = match[1];
    let repo = match[2];
    if (repo.endsWith("/")) repo = repo.slice(0, -1);
    if (repo.endsWith(".git")) repo = repo.slice(0, -4);

    const headers: Record<string, string> = {
      "User-Agent": "ReleaseProxy-Service/1.0",
      "Accept": "application/vnd.github+json",
    };
    
    // Inject secret token if available
    if (process.env.GEMINI_API_KEY) {
      // In case we want to use any other configured environment variable
    }

    console.log(`[Fetch Releases] Querying GitHub info for: https://github.com/${owner}/${repo}`);

    // Try fetching /releases/latest first
    let apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
    let releaseData: any = null;

    if (apiRes.status === 404) {
      // If no official 'latest' marked release, list releases and pick the first one from history
      console.log(`[Fetch Releases] Latest release endpoint 404. Listing overall releases as fallback.`);
      const listRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, { headers });
      if (listRes.ok) {
        const releasesList = await listRes.json();
        if (Array.isArray(releasesList) && releasesList.length > 0) {
          releaseData = releasesList[0];
        }
      }
    } else if (apiRes.ok) {
      releaseData = await apiRes.json();
    }

    // Handle rate-limits or secondary API issues
    if (apiRes.status === 403 || apiRes.status === 429) {
      return res.status(429).json({ 
        error: "GitHub API rate limit exceeded. Please try again in a few minutes or enter another public repository." 
      });
    }

    // Try fallback check if repository exists at all
    if (!releaseData) {
      const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (repoCheck.status === 404) {
        return res.status(404).json({ error: "GitHub repository not found or is private." });
      }
      return res.status(404).json({ error: "No releases found on this repository's Release page. Push a tagged release first." });
    }

    const tagName = releaseData.tag_name;
    const releaseName = releaseData.name || tagName;
    const publishDate = releaseData.published_at;
    const zipball = releaseData.zipball_url;
    const tarball = releaseData.tarball_url;

    const apiAssets = releaseData.assets || [];
    const assetsList = apiAssets.map((asset: any) => ({
      name: asset.name,
      size: asset.size,
      downloadCount: asset.download_count,
      browserDownloadUrl: asset.browser_download_url,
      contentType: asset.content_type,
    }));

    // Append dynamic zipball & tarball source URLs as fallback assets
    if (zipball) {
      assetsList.push({
        name: `Source Code Archive (zip)`,
        size: null,
        downloadCount: null,
        browserDownloadUrl: zipball,
        contentType: "application/zip",
        isSourceCode: true
      });
    }
    if (tarball) {
      assetsList.push({
        name: `Source Code Archive (tar.gz)`,
        size: null,
        downloadCount: null,
        browserDownloadUrl: tarball,
        contentType: "application/gzip",
        isSourceCode: true
      });
    }

    res.json({
      owner,
      repo,
      tagName,
      releaseName,
      publishDate,
      assets: assetsList,
    });
  } catch (err: any) {
    console.error("Fetch releases exception:", err);
    res.status(500).json({ error: err.message || "Failed to contact GitHub services." });
  }
});

// 3. API: Active functional download proxy
app.get("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }
  await handleProxyStream(targetUrl, res);
});

// 4. API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
}

startServer();
