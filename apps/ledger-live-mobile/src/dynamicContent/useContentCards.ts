import { useEffect } from "react";
import { useDynamicContentLogic } from "./useDynamicContentLogic";

const HookDynamicContentCards = () => {
  const { refreshDynamicContent, fetchData, clearOldDismissedContentCards } =
    useDynamicContentLogic();

  useEffect(() => {
    clearOldDismissedContentCards();
    refreshDynamicContent();
    fetchData();
  }, [fetchData, refreshDynamicContent, clearOldDismissedContentCards]);

  return null;
};

export default HookDynamicContentCards;
