import { useCallback, useContext } from "react";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { UpdaterContext, UpdateStatus } from "~/renderer/components/Updater/UpdaterContext";

export const BANNER_VISIBLE_STATUS: readonly UpdateStatus[] = [
  "download-progress",
  "checking",
  "check-success",
  "error",
  "update-available",
  "downloading-update",
];

export const TOP_BAR_VISIBLE_STATUS: readonly UpdateStatus[] = [
  "update-available",
  "download-progress",
  "error",
  "check-success",
];

export const useUpdaterStatus = () => {
  const context = useContext(UpdaterContext);
  const urlLive = useLocalizedUrl(urls.liveHome);

  const reDownload = useCallback(() => openURL(urlLive), [urlLive]);

  const getActionHandler = useCallback(
    (status: UpdateStatus): (() => void) | undefined => {
      if (!context) return undefined;

      if (status === "check-success") return context.quitAndInstall;
      if (status === "error") return reDownload;
      return undefined;
    },
    [context, reDownload],
  );

  const isBannerVisible =
    !!context && !!context.version && BANNER_VISIBLE_STATUS.includes(context.status);

  const isTopBarVisible = !!context && TOP_BAR_VISIBLE_STATUS.includes(context.status);

  return {
    context,
    isBannerVisible,
    isTopBarVisible,
    getActionHandler,
  };
};
