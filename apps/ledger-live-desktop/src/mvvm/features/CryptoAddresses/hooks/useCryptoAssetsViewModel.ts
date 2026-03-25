import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { CryptoAssetsViewModel } from "../types";

export default function useCryptoAssetsViewModel(): CryptoAssetsViewModel {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    title: t("cryptoAssets.title"),
    onBack,
  };
}
