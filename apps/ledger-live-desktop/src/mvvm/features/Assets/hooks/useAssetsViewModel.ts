import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { AssetsViewProps } from "../AssetsView";

// It will be implemented in https://ledgerhq.atlassian.net/browse/LIVE-26296

export function useAssetsViewModel(): AssetsViewProps {
  const { categorizedAssets, isLoadingStablecoinTickers } = useCategorizedAssetsFromPortfolio();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onNavigate = useCallback(() => {
    navigate("/assets");
  }, [navigate]);

  return {
    isLoading: isLoadingStablecoinTickers,
    data: categorizedAssets,
    onNavigate,
    t,
  };
}
