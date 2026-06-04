import { useCallback, useState } from "react";
import {
  FIFTEEN_MINUTES_IN_MS,
  useGetAltcoinSeasonIndexLatestQuery,
} from "@ledgerhq/live-common/cmc-client/state-manager/api";
import { track } from "~/analytics";
import type { AltcoinSeasonViewModel } from "./types";

const BUTTON_NAME = "altcoin_index_definition";

function trackDefinitionPressed() {
  track("button_clicked", {
    button: BUTTON_NAME,
  });
}

export function useAltcoinSeasonViewModel(): AltcoinSeasonViewModel {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading, isError } = useGetAltcoinSeasonIndexLatestQuery(undefined, {
    pollingInterval: FIFTEEN_MINUTES_IN_MS,
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
