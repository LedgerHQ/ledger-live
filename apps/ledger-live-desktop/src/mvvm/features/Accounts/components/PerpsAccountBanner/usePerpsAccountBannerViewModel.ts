import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { track } from "~/renderer/analytics/segment";

export function usePerpsAccountBannerViewModel(currency: CryptoCurrency) {
  const navigate = useNavigate();
  const perpsLiveApp = useFeature("ptxPerpsLiveApp");

  const onOpenPerps = useCallback(() => {
    track("button_clicked", {
      button: "open_perps",
      banner: "perps account",
      page: "Account",
    });
    navigate("/perps");
  }, [navigate]);

  return {
    isVisible: currency.family === "hypercore" && Boolean(perpsLiveApp?.enabled),
    onOpenPerps,
  };
}
