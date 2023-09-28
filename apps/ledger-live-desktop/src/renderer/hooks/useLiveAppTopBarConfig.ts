import { TopBarConfig } from "../components/WebPlatformPlayer/TopBar";

export const useLiveAppTopBarConfig = (): TopBarConfig => {
  return {
    shouldDisplayName: false,
    shouldDisplayInfo: false,
    shouldDisplayClose: false,
    shouldDisplayNavigation: false,
  };
};
