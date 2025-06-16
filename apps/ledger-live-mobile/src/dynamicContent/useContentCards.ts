import { useCallback, useEffect } from "react";
import { useDynamicContentLogic } from "./useDynamicContentLogic";

const HookDynamicContentCards = () => {
  const { refreshDynamicContent, fetchData, clearOldDismissedContentCards } =
    useDynamicContentLogic();

  const fetchContentCardsData = useCallback(async () => {
    clearOldDismissedContentCards();
    refreshDynamicContent();
    await fetchData();
  }, [refreshDynamicContent, fetchData, clearOldDismissedContentCards]);

  useEffect(() => {
    fetchContentCardsData();
  }, [fetchContentCardsData]);

  return null;
};

export default HookDynamicContentCards;
