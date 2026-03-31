import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { Tools } from "@ledgerhq/lumen-ui-react/symbols";
import {
  featureFlagsBannerVisibleSelector,
  featureFlagsOverridesSelector,
} from "@shared/feature-flags";

export const useFeatureFlags = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isFeatureFlagsBannerVisible = useSelector(featureFlagsBannerVisibleSelector);
  const overriddenFeatureFlags = useSelector(featureFlagsOverridesSelector);

  const isVisible =
    isFeatureFlagsBannerVisible || Object.keys(overriddenFeatureFlags ?? {}).length !== 0;

  const handleFeatureFlags = useCallback(() => {
    const url = "/settings/developer";
    if (location.pathname !== url) {
      navigate(url);
    }
  }, [navigate, location.pathname]);

  return {
    isVisible,
    handleFeatureFlags,
    icon: Tools,
    tooltip: t("common.featureFlags"),
  };
};
