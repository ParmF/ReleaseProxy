export interface Asset {
  name: string;
  size: number | null;
  downloadCount: number | null;
  browserDownloadUrl: string;
  contentType: string;
  isSourceCode?: boolean;
}

export interface ReleaseInfo {
  owner: string;
  repo: string;
  tagName: string;
  releaseName: string;
  publishDate: string;
  assets: Asset[];
}

export type ViewTab = 'proxy' | 'api' | 'docs' | 'status';
