import { useState, useCallback } from "react";
import {
  useGetFearAndGreedLatestQuery,
  FIFTEEN_MINUTES_IN_MS,
} from "@ledgerhq/live-common/cmc-client/state-manager/api";
import type { FearAndGreedViewModel } from "./types";
import { track } from "~/analytics";

const BUTTON_NAME = "mood_index_definition";

function trackDefinitionPressed() {
  track("button_clicked", {
    button: BUTTON_NAME,
  });
}

export const useFearAndGreedViewModel = (): FearAndGreedViewModel => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isError } = useGetFearAndGreedLatestQuery(undefined, {
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
    isError,
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
  };
};
