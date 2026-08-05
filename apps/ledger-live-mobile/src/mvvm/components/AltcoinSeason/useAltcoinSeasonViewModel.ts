import { useCallback, useState } from "react";
import { useGetAltcoinSeasonIndexLatestQuery } from "@domain/api-altcoins-sentiment";
import { track } from "~/analytics";
import type { AltcoinSeasonViewModel } from "./types";
import { ALTCOIN_SEASON_REFRESH_INTERVAL_MS } from "./constants";

const BUTTON_NAME = "altcoin_index_definition";

function trackDefinitionPressed() {
  track("button_clicked", {
    button: BUTTON_NAME,
  });
}

export function useAltcoinSeasonViewModel(): AltcoinSeasonViewModel {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading, isError } = useGetAltcoinSeasonIndexLatestQuery(undefined, {
    pollingInterval: ALTCOIN_SEASON_REFRESH_INTERVAL_MS,
  });

  const handleOpenDrawer = useCallback(() => {
    trackDefinitionPressed();
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return {
    data,
    isLoading,
    isError,
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
  };
}
