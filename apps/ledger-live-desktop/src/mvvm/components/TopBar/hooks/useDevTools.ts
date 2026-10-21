import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { Code } from "@ledgerhq/lumen-ui-react/symbols";
import {
  featureFlagsBannerVisibleSelector,
  featureFlagsOverridesSelector,
} from "@shared/feature-flags";
import { developerModeSelector } from "~/renderer/reducers/settings";
import { openDevToolsWindow } from "LLD/features/DevTools/components/DevToolsWindow/devToolsWindow";

export const useDevTools = () => {
  const { t } = useTranslation();
  const isDeveloperMode = useSelector(developerModeSelector);
  const isFeatureFlagsBannerVisible = useSelector(featureFlagsBannerVisibleSelector);
  const overriddenFeatureFlags = useSelector(featureFlagsOverridesSelector);

  const isVisible =
    isDeveloperMode ||
    isFeatureFlagsBannerVisible ||
    Object.keys(overriddenFeatureFlags ?? {}).length !== 0;

  return {
    isVisible,
    handleDevTools: openDevToolsWindow,
    icon: Code,
    tooltip: t("common.devTools"),
  };
};
