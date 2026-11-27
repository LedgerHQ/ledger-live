import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { SettingsAbout, type SettingsAboutPort } from "@features/flow-settings-about";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { TrackScreen } from "@shared/analytics-react";
import { getEnv } from "@shared/env";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { urls } from "~/config/urls";
import { setDeveloperMode } from "~/renderer/actions/settings";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { developerModeSelector } from "~/renderer/reducers/settings";

function useDesktopAboutPort(): SettingsAboutPort {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { pushToast } = useToasts();
  const developerMode = useSelector(developerModeSelector);
  const termsUrl = useLocalizedUrl(urls.terms);

  const unlockDeveloperTools = useCallback(() => {
    if (developerMode) return;
    dispatch(setDeveloperMode(true));
    pushToast({
      id: uuidv4(),
      type: "achievement",
      title: t("settings.developer.toast.title"),
      text: t("settings.developer.toast.text"),
      icon: "info",
    });
  }, [developerMode, dispatch, pushToast, t]);

  return useMemo(
    () => ({
      version: getEnv("PLAYWRIGHT_RUN") ? "0.0.0" : __APP_VERSION__,
      termsUrl,
      unlockDeveloperTools,
    }),
    [termsUrl, unlockDeveloperTools],
  );
}

/** The About section of the new Settings on desktop, shown behind the newSettings flag. */
export function DesktopAboutSection() {
  const port = useDesktopAboutPort();
  return (
    <>
      <TrackScreen category="Settings" name="About" />
      <SettingsAbout port={port} testID="settings-about" />
    </>
  );
}
