import { useState, useCallback } from "react";
import { useGetFearAndGreedLatestQuery } from "@domain/api-market-sentiment";
import type { FearAndGreedViewModel } from "./types";
import { track } from "~/analytics";
import { FEAR_AND_GREED_REFRESH_INTERVAL_MS } from "./constants";

const BUTTON_NAME = "mood_index_definition";

function trackDefinitionPressed() {
  track("button_clicked", {
    button: BUTTON_NAME,
  });
}

export const useFearAndGreedViewModel = (): FearAndGreedViewModel => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, isLoading, isError } = useGetFearAndGreedLatestQuery(undefined, {
    pollingInterval: FEAR_AND_GREED_REFRESH_INTERVAL_MS,
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
};
