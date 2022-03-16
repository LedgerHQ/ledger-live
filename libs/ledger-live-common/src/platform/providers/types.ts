export type Loadable<T> = {
  error: any | null;
  isLoading: boolean;
  value: T | null;
};

export type AppPlatform =
  | "desktop" // == windows || mac || linux
  | "mobile" // == android || ios
  | "all";

export type AppBranch = "stable" | "experimental" | "soon" | "debug";

export type LiveAppPermission = {
  method: string;
  params?: any;
};

export type LiveAppManifest = {
  id: string;
  private?: boolean;
  name: string;
  url: string;
  params?: string[];
  homepageUrl: string;
  supportUrl?: string;
  icon?: string | null;
  platform: AppPlatform;
  apiVersion: string;
  manifestVersion: string;
  branch: AppBranch;
  permissions: LiveAppPermission[];
  domains: string[];
};
