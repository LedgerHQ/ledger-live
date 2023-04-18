declare const __APP_VERSION__: string;
declare const INDEX_URL: string;
declare const __SENTRY_URL__: string;
declare const __APP_VERSION__: string;
declare const __GIT_REVISION__: string;
declare const __PRERELEASE__: string;
declare const __CHANNEL__: string;
declare const __static: string;

declare module "*.svg";
declare module "*.png";

declare namespace Electron {
  interface BrowserWindow {
    name?: string;
  }

  interface App {
    dirname?: string;
  }
}

interface Window {
  api?: {
    appLoaded: () => void;
    reloadRenderer: () => void;
    openWindow: (id: number) => void;
  };
}
