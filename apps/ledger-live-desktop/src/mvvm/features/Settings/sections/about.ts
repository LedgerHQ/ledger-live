import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import type { SettingsAboutPort } from "@features/flow-settings-about";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { getEnv } from "@shared/env";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { urls } from "~/config/urls";
import { setDeveloperMode } from "~/renderer/actions/settings";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { developerModeSelector } from "~/renderer/reducers/settings";

/**
 * The About section's part of the settings port: the app version, the localized terms URL and
 * the developer unlock the legacy About runs on the fifth tap of the version.
 */
export function useAboutSettingsAdapter(): SettingsAboutPort {
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

  const values = useMemo(
    () => ({
      version: getEnv("PLAYWRIGHT_RUN") ? "0.0.0" : __APP_VERSION__,
      termsUrl,
    }),
    [termsUrl],
  );

  return useMemo(
    () => ({ values, setValue: () => undefined, unlockDeveloperTools }),
    [values, unlockDeveloperTools],
  );
}
