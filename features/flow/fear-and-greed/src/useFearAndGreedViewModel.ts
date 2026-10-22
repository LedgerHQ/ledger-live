import { useCallback, useRef, useState } from "react";
import { track } from "@shared/analytics";
import { useGetFearAndGreedLatestQuery } from "@domain/api-market-index-fear-and-greed";
import { FEAR_AND_GREED_REFRESH_INTERVAL_MS } from "./constants";
import type { FearAndGreedViewModel } from "./types";

export function useFearAndGreedViewModel(): FearAndGreedViewModel {
  const [isDefinitionOpen, setIsDefinitionOpen] = useState(false);
  const isDefinitionOpenRef = useRef(false);
  const { data, isError, isLoading } = useGetFearAndGreedLatestQuery(undefined, {
    pollingInterval: FEAR_AND_GREED_REFRESH_INTERVAL_MS,
  });

  const onOpenDefinition = useCallback(() => {
    if (!isDefinitionOpenRef.current) {
      track("button_clicked", { button: "mood_index_definition" });
    }
    isDefinitionOpenRef.current = true;
    setIsDefinitionOpen(true);
  }, []);

  const onCloseDefinition = useCallback(() => {
    isDefinitionOpenRef.current = false;
    setIsDefinitionOpen(false);
  }, []);

  return {
    data,
    isLoading,
    isError,
    isDefinitionOpen,
    onOpenDefinition,
    onCloseDefinition,
  };
}
