import { useState } from "react";
import { track } from "~/renderer/analytics/segment";

export function usePagination(initialCount: number, analyticsName?: string) {
  const [nbToShow, setNbToShow] = useState(initialCount);
  const [skip, setSkip] = useState(0);

  const loadMore = () => {
    if (analyticsName) track(analyticsName);
    setNbToShow(prev => prev + initialCount);
    setSkip(prev => prev + nbToShow);
  };

  return { nbToShow, loadMore, skip };
}
