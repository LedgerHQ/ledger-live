import { useEffect } from "react";
import { useDynamicContentLogic } from "./useDynamicContentLogic";

const HookDynamicContentCards = () => {
  const { refreshDynamicContent, fetchData } = useDynamicContentLogic();

  useEffect(() => {
    refreshDynamicContent();
    fetchData();
  }, [fetchData, refreshDynamicContent]);

  return null;
};

export default HookDynamicContentCards;
