import { useState } from "react";
import { track } from "~/renderer/analytics/segment";

export function usePagination(initialCount: number, analyticsName?: string) {
  const [nbToShow, setNbToShow] = useState(initialCount);

  const loadMore = () => {
    if (analyticsName) track(analyticsName);
    setNbToShow(prev => prev + initialCount);
  };

  return { nbToShow, loadMore };
}
