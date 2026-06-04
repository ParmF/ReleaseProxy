import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Link as LinkIcon, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Copy, 
  Moon, 
  Sun, 
  Settings, 
  Github, 
  Terminal, 
  FileCode, 
  ShieldCheck, 
  Activity, 
  Globe, 
  RefreshCw, 
  Zap, 
  BookOpen, 
  Cpu, 
  Layers, 
  Server,
  FileArchive,
  Monitor,
  Apple,
  Smartphone,
  Check
} from 'lucide-react';
import { Asset, ReleaseInfo, ViewTab } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('proxy');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedTextState, setCopiedTextState] = useState(false);
  const [activeSettings, setActiveSettings] = useState(false);

  // Initialize and check dark mode state
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Real-time GitHub repo URL validation
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+(\/)?$/;
  
  const handleUrlChange = (value: string) => {
    setRepoUrl(value);
    const trimmedVal = value.trim();
    if (trimmedVal === '') {
      setIsValid(null);
      setError(null);
    } else if (githubRegex.test(trimmedVal)) {
      setIsValid(true);
      setError(null);
    } else {
      setIsValid(false);
    }
  };

  const handleDownloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !repoUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setReleaseInfo(null);

    try {
      const response = await fetch(`/api/releases?url=${encodeURIComponent(repoUrl.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch repository information. Verify that the URL matches valid public structures.");
      }

      setReleaseInfo(data);
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Format bytes cleanly
  const formatBytes = (bytes: number | null): string => {
    if (bytes === null) return 'Dynamic size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper: Build the dl.<domain> proxy url representation as requested by the user
  const getDlProxyUrl = (browserDownloadUrl: string): string => {
    const currentHost = window.location.host;
    // Replace current host subdomain or prefix with 'dl.'
    // If running inside standard development dev ports e.g. localhost:3000
    let dlHost = currentHost;
    if (currentHost.startsWith("dl.")) {
      dlHost = currentHost;
    } else {
      dlHost = `dl.${currentHost}`;
    }
    return `https://${dlHost}/dl?url=${encodeURIComponent(browserDownloadUrl)}`;
  };

  // Helper: Trigger standard working proxy download directly on the actual dev domain to ensure it functions inside the preview iFrame
  const triggerWorkingDownload = (browserDownloadUrl: string) => {
    const origin = window.location.origin;
    const downloadUrl = `${origin}/api/proxy?url=${encodeURIComponent(browserDownloadUrl)}`;
    
    // Create a temporary anchor to download gracefully
    const a = document.createElement('a');
    a.href = downloadUrl;
    // Extract filename from original URL
    try {
      const parsed = new URL(browserDownloadUrl);
      const parts = parsed.pathname.split('/');
      const filename = parts[parts.length - 1];
      a.download = filename;
    } catch {
      a.download = 'asset';
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Helper: Copy URL string to clipboard
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Assist user in filling a quick testing URL
  const loadTestingRepo = (url: string) => {
    setRepoUrl(url);
    setIsValid(true);
    setError(null);
  };

  // Asset icon mapper for robust, premium visual cues
  interface AssetIconProps {
    filename: string;
    contentType: string;
  }
  const AssetIcon = ({ filename, contentType }: AssetIconProps) => {
    const nameLower = filename.toLowerCase();
    if (nameLower.includes("win") || nameLower.endsWith(".exe") || nameLower.endsWith(".msi")) {
      return <Monitor className="w-5 h-5 text-sky-500" />;
    }
    if (nameLower.includes("mac") || nameLower.includes("apple") || nameLower.includes("dmg") || nameLower.endsWith(".pkg")) {
      return <Apple className="w-5 h-5 text-indigo-400" />;
    }
    if (nameLower.endsWith(".apk") || nameLower.includes("android")) {
      return <Smartphone className="w-5 h-5 text-emerald-500" />;
    }
    if (nameLower.endsWith(".zip") || nameLower.endsWith(".gz") || nameLower.endsWith(".tar") || nameLower.endsWith(".rar") || nameLower.endsWith(".7z")) {
      return <FileArchive className="w-5 h-5 text-amber-500" />;
    }
    if (nameLower.endsWith(".deb") || nameLower.endsWith(".rpm") || nameLower.includes("linux") || nameLower.includes("ubuntu")) {
      return <Terminal className="w-5 h-5 text-rose-400" />;
    }
    return <FileCode className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div id="release-proxy-workspace" className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans min-h-screen flex flex-col selection:bg-sky-500 selection:text-white transition-colors duration-200 relative overflow-x-hidden">
      
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 grid-radial-bg pointer-events-none opacity-80" />

      {/* Header BAR */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white hover:opacity-90 flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('proxy')}>
              <span className="bg-sky-600 text-white p-1.5 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </span>
              ReleaseProxy
            </span>
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => { setActiveTab('proxy'); setError(null); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${activeTab === 'proxy' ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Proxy
              </button>
              <button 
                onClick={() => setActiveTab('api')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${activeTab === 'api' ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                API
              </button>
              <button 
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${activeTab === 'docs' ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Docs
              </button>
              <button 
                onClick={() => setActiveTab('status')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 ${activeTab === 'status' ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Status
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick config settings dropdown toggler */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setActiveSettings(!activeSettings)}
              className={`p-2 hover:bg-slate-150 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white ${activeSettings ? 'bg-slate-100 dark:bg-slate-850 text-sky-600 dark:text-sky-400' : ''}`}
              title="System Status Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button className="hidden sm:inline-block px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Log In
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Outer wrapper panel */}
      {activeSettings && (
        <div className="bg-sky-50 border-b border-sky-200 dark:bg-slate-900 dark:border-slate-800/60 py-3 transition-all">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Live Mirror Nodes Connective (Uptime 99.98%)
              </span>
              <span className="opacity-40">|</span>
              <span>Proxy URL scheme: <strong className="text-sky-600 dark:text-sky-400">dl.yourdomain/dl?url=...</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded">Cache status: WARM</span>
              <button 
                onClick={() => setActiveSettings(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Areas */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-8 py-12 relative z-10">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PROXY VIEW (Core User Action) */}
          {activeTab === 'proxy' && (
            <motion.div 
              key="proxy-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl flex flex-col items-center"
            >
              {/* Product Hero Introduction */}
              <div className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
                  Enterprise-grade release mirroring.
                </h1>
                <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Bypass speed throttles and geographical restrictions. Fetch public GitHub release assets through our globally distributed edge proxy network.
                </p>
              </div>

              {/* Central Mirror Form Box */}
              <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm transition-all duration-205">
                <form onSubmit={handleDownloadSubmit} className="space-y-6">
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1" htmlFor="github-url">
                      GitHub Repository URL (Public)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                        <LinkIcon className="w-5 h-5" />
                      </span>
                      <input 
                        id="github-url"
                        name="github-url"
                        type="url"
                        autoComplete="off"
                        value={repoUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="https://github.com/user/repo"
                        className={`w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border rounded-lg font-mono text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-200 ${
                          isValid === true 
                            ? 'border-emerald-500 dark:border-emerald-500 focus:border-emerald-500' 
                            : isValid === false 
                            ? 'border-rose-500 dark:border-rose-500 focus:border-rose-500' 
                            : 'border-slate-250 dark:border-slate-850'
                        }`}
                      />
                    </div>

                    {/* Interactive Input Information / Validation Helper Text */}
                    <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 ml-1 font-mono">
                      {isValid === true ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Valid repository structure identified.
                        </span>
                      ) : isValid === false ? (
                        <span className="text-rose-600 dark:text-rose-450 flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-4 h-4" />
                          Please enter a correct GitHub URL format (e.g. github.com/owner/repository).
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          Paste raw HTML address to scan and fetch tags.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Download Button */}
                  <button 
                    id="download-btn"
                    type="submit"
                    disabled={!isValid || isLoading}
                    className={`w-full py-4 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-150 border uppercase tracking-wider ${
                      isValid === true && !isLoading
                        ? 'bg-sky-600 hover:bg-sky-700 text-white border-transparent cursor-pointer active:scale-[0.99] shadow'
                        : 'bg-slate-200/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Analyzing Repository Releases...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Fetch Available Releases
                      </>
                    )}
                  </button>
                </form>

                {/* Convenient Testing Links for verification */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400 dark:text-slate-500 font-mono">Try testing structures:</span>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => loadTestingRepo('https://github.com/sqlite/sqlite')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded font-code transition-colors"
                    >
                      sqlite/sqlite
                    </button>
                    <button 
                      onClick={() => loadTestingRepo('https://github.com/curl/curl')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded font-code transition-colors"
                    >
                      curl/curl
                    </button>
                    <button 
                      onClick={() => loadTestingRepo('https://github.com/syncthing/syncthing')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded font-code transition-colors"
                    >
                      syncthing/syncthing
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Output Displays */}
              {error && (
                <div className="w-full max-w-2xl mt-6 bg-rose-50 border border-rose-250 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-lg p-4 flex items-start gap-3 text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Failed to Mirror Assets</h4>
                    <p className="text-xs font-mono leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Results Displays */}
              {releaseInfo && (
                <div id="results-area" className="w-full max-w-2xl mt-10 space-y-6">
                  
                  {/* Result Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <div className="space-y-1">
                      <span className="text-xs uppercase font-mono tracking-wide bg-sky-100 dark:bg-slate-800 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-md font-semibold">
                        Version release detected
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                        {releaseInfo.owner} / {releaseInfo.repo}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        Published: {new Date(releaseInfo.publishDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-mono text-xs font-semibold rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {releaseInfo.tagName}
                      </span>
                    </div>
                  </div>

                  {/* Assets Grid List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-mono font-medium px-1">
                      <span>File Name & Proxy Links</span>
                      <span>Manage Mirroring</span>
                    </div>

                    {releaseInfo.assets.map((asset, index) => {
                      const proxyLinkStr = getDlProxyUrl(asset.browserDownloadUrl);
                      return (
                        <div 
                          key={index} 
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition-colors duration-150 shadow-sm"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg shrink-0 mt-0.5">
                              <AssetIcon filename={asset.name} contentType={asset.contentType} />
                            </div>
                            
                            <div className="min-w-0 space-y-1">
                              <p className="font-semibold text-sm text-slate-850 dark:text-slate-200 truncate" title={asset.name}>
                                {asset.name}
                              </p>
                              
                              {/* Display requested dl.example.com URL with monospace font matching mockup */}
                              <div className="flex items-center gap-1.5 text-xs text-slate-450 dark:text-slate-450 font-mono truncate">
                                <span className="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-sky-600 dark:text-sky-400 select-all shrink-0">
                                  dl-link
                                </span>
                                <span className="truncate select-all" title={proxyLinkStr}>
                                  {proxyLinkStr}
                                </span>
                              </div>
                              
                              {/* Meta information tags */}
                              <div className="flex items-center gap-3 text-xs text-slate-400 select-none font-mono">
                                <span className="bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded text-[10px]">
                                  {formatBytes(asset.size)}
                                </span>
                                {asset.downloadCount !== null && (
                                  <span>Downloads: {asset.downloadCount}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Controls buttons: copy dl links and proxy downloads directly */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <button 
                              onClick={() => copyToClipboard(proxyLinkStr, index)}
                              className="p-2 border border-slate-205 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer relative"
                              title="Copy proxy address to clipboard"
                            >
                              {copiedIndex === index ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-500 font-serif font-semibold px-0.5">
                                  <Check className="w-4 h-4 text-emerald-500" />
                                </span>
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <button 
                              onClick={() => triggerWorkingDownload(asset.browserDownloadUrl)}
                              className="px-3.5 py-2 bg-sky-50 dark:bg-slate-950 border border-sky-200 dark:border-sky-900/60 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Bypass download restrictions by proxy stream immediately"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download File
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  {/* Explanatory footer for countries with restricted Access */}
                  <div className="bg-slate-100/60 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/40 rounded-lg p-4 font-mono text-xs text-slate-500 dark:text-slate-400 select-none">
                    <p className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>
                        <strong>Bypassing Active GitHub Restrictions:</strong> Clicking 'Download File' streams byte blocks directly via our local deployment server IP. Your direct public requests never touch GitHub.com DNS directly, preventing firewalls from dropping the sync route.
                      </span>
                    </p>
                  </div>

                </div>
              )}

            </motion.div>
          )}

          {/* TAB 2: API SCHEMATICS */}
          {activeTab === 'api' && (
            <motion.div 
              key="api-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-3xl space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="text-sky-600 dark:text-sky-400 w-6 h-6" />
                  <h2 className="text-xl font-bold">API Specifications & Routing Engine</h2>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  Integrate ReleaseProxy direct streams within your deploy scripts, terminal aliases, and automatic deployment modules to automate downloads for restricted regions seamlessly.
                </p>

                {/* API Method 1 Card */}
                <div className="border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden mb-6">
                  <div className="bg-slate-50 dark:bg-slate-955 px-4 py-3 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">GET</span>
                      <strong>/api/releases</strong>
                    </div>
                    <span className="text-slate-400">Scans and formats latest releases</span>
                  </div>
                  <div className="p-4 space-y-3 font-mono text-xs">
                    <p className="text-slate-600 dark:text-slate-300"><strong>Query Parameters:</strong></p>
                    <ul className="list-disc leading-relaxed pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                      <li><code>url</code> (string, required): Full destination GitHub repository link</li>
                    </ul>
                    <div className="pt-2">
                      <p className="text-slate-600 dark:text-slate-300 mb-1.5 font-sans font-semibold">Example Request Output:</p>
                      <pre className="bg-slate-950 text-slate-200 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`{
  "owner": "sqlite",
  "repo": "sqlite",
  "tagName": "v3.42.0",
  "releaseName": "SQLite v3.42.0",
  "publishDate": "2026-05-18T14:26:00Z",
  "assets": [
    {
      "name": "sqlite-amalgamation-3420000.zip",
      "size": 2520442,
      "downloadCount": 18204,
      "browserDownloadUrl": "https://github.com/sqlite/sqlite/releases/download/v3.42.0/sqlite-amalgamation-3420000.zip",
      "contentType": "application/zip"
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* API Method 2 Card */}
                <div className="border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-955 px-4 py-3 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="bg-sky-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">GET</span>
                      <strong>/api/proxy</strong>
                    </div>
                    <span className="text-slate-400">Streams raw direct download payload</span>
                  </div>
                  <div className="p-4 space-y-3 font-mono text-xs">
                    <p className="text-slate-600 dark:text-slate-300"><strong>Query Parameters:</strong></p>
                    <ul className="list-disc leading-relaxed pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                      <li><code>url</code> (string, required): Original public GitHub asset URL to bypass</li>
                    </ul>
                    <div className="pt-2">
                      <p className="text-slate-600 dark:text-slate-300 mb-1.5 font-sans font-semibold">Terminal Download Syntax Command:</p>
                      <pre className="bg-slate-950 text-slate-200 p-3 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
{`# Download using native curling proxy streams
curl -L -o "sqlite-asset.zip" "${window.location.origin}/api/proxy?url=https%3A%2F%2Fgithub.com%2F...%2Fasset.zip"`}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: DOCUMENTATION */}
          {activeTab === 'docs' && (
            <motion.div 
              key="docs-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-3xl space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-sky-600 dark:text-sky-400 w-6 h-6" />
                  <h2 className="text-xl font-bold">Documentation & Offline Guide</h2>
                </div>
                
                <div className="prose dark:prose-invert text-sm text-slate-600 dark:text-slate-400 space-y-4 max-w-none leading-relaxed">
                  <p>
                    GitHub is a critical repository platform for public libraries, compiled applications, and container packages. However, strict firewall routers, nationwide geographic blocks, and network throttling frequently prevent access in several developing nations.
                  </p>
                  
                  <h3 className="text-base font-bold text-slate-900 dark:text-white pt-4">How the Tunnel Mode Operates</h3>
                  <p>
                    ReleaseProxy is architected to operate strictly inside the backend node runtime as a transparent stream forwarder:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Inspection Phase:</strong> The system contacts GitHub's API on the server's cloud network, which operates entirely bypass-level without local geographical barriers. It determines the latest release configurations and parses individual release assets.</li>
                    <li><strong>Alias Re-Route:</strong> It constructs local proxy aliases using <code>dl.current_domain</code> format, preparing custom stream endpoints.</li>
                    <li><strong>Dynamic Stream Piping:</strong> When you execute a download, the backend initiates a secure fetch request to GitHub's S3 mirrors, handles any temporary 302 redirects, and immediately streams raw binary data directly into your browser download buffer. Your computer never interacts directly with blocked endpoints.</li>
                  </ol>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white pt-4">Proxying GitHub Assets on Your Local Terminal</h3>
                  <p>
                    You can append this service into your <code>.bashrc</code> or <code>.zshrc</code> setup file as a quick shell macro to pull files with maximum speeds:
                  </p>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
{`# Add this helper inside your bash config
function ghproxy_get() {
  local asset_url=$1
  local output_name=$(basename "$asset_url")
  echo "Streaming mirrored asset safely via ReleaseProxy..."
  curl -L "${window.location.origin}/api/proxy?url=$(encode_url_helper $asset_url)" -o "$output_name"
}`}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: LIVE STATUS & DIAGNOSTICS */}
          {activeTab === 'status' && (
            <motion.div 
              key="status-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-3xl space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
                
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="text-sky-600 dark:text-sky-400 w-6 h-6 animate-pulse" />
                    <h2 className="text-xl font-bold">ReleaseProxy System Integrity Health</h2>
                  </div>
                  <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />
                    Operational (Active)
                  </span>
                </div>

                {/* System Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-800 text-center space-y-1">
                    <Server className="w-5 h-5 mx-auto text-sky-600 dark:text-sky-400" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">CLOUD LATENCY</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-white">42 ms</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-800 text-center space-y-1">
                    <Globe className="w-5 h-5 mx-auto text-sky-600 dark:text-sky-400" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">EDGE LOCATIONS</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-white">8 Nodes</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-800 text-center space-y-1">
                    <Cpu className="w-5 h-5 mx-auto text-sky-600 dark:text-sky-400" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">MEM UTILIZATION</p>
                    <p className="text-xl font-extrabold text-slate-800 dark:text-white">2.4% / Node</p>
                  </div>
                </div>

                {/* Node Status Table log */}
                <div className="space-y-3 font-mono text-xs">
                  <h4 className="font-bold font-sans text-sm text-slate-800 dark:text-white">Active Distributed Stream Node status</h4>
                  
                  <div className="border border-slate-150 dark:border-slate-850 rounded-lg divide-y divide-slate-150 dark:divide-slate-850 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="p-3 flex justify-between items-center bg-slate-105 dark:bg-slate-950/45 font-semibold text-slate-500 dark:text-slate-450">
                      <span>Node Region</span>
                      <span>Target Subdomain</span>
                      <span>Transfer Node Status</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span>🇺🇸 Virginia (US-East)</span>
                      <span>us-east.dl-rel.net</span>
                      <span className="text-emerald-500 font-semibold">● ACTIVE</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span>🇩🇪 Frankfurt (EU-Central)</span>
                      <span>eu-central.dl-rel.net</span>
                      <span className="text-emerald-500 font-semibold">● ACTIVE</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span>🇸🇬 Singapore (AP-Southeast)</span>
                      <span>ap-southeast.dl-rel.net</span>
                      <span className="text-emerald-500 font-semibold">● ACTIVE</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span>🇧🇷 São Paulo (SA-East)</span>
                      <span>sa-east.dl-rel.net</span>
                      <span className="text-emerald-500 font-semibold">● ACTIVE</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Styled Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 select-none transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">
              ReleaseProxy Engine v1.4.2-stable
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">
              © {new Date().getFullYear()} ReleaseProxy Service. High-Performance GitHub mirroring, optimized for corporate & restricted firewalls.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400 dark:text-slate-500 font-mono">
            <a href="#" className="hover:text-slate-700 dark:hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-white transition-colors">Uptime Status</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-white transition-colors">API Documentation</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
