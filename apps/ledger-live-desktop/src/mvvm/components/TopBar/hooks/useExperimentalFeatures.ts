import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Experiment } from "@ledgerhq/lumen-ui-react/symbols";
import useExperimental from "~/renderer/hooks/useExperimental";

export const useExperimentalFeatures = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isExperimental = useExperimental();

  const handleExperimental = useCallback(() => {
    const url = "/settings/experimental";
    if (location.pathname !== url) {
      navigate(url);
    }
  }, [navigate, location.pathname]);

  return {
    isVisible: isExperimental,
    handleExperimental,
    icon: Experiment,
    tooltip: t("common.experimentalFeature"),
  };
};
