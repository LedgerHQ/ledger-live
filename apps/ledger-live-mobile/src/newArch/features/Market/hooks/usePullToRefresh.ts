import { useState, useCallback, useEffect } from "react";
import { track } from "~/analytics";

interface UsePullToRefreshProps {
  loading: boolean;
  refetch: () => void;
}

function usePullToRefresh({ loading, refetch }: UsePullToRefreshProps) {
  const trackPullToRefresh = useCallback(() => {
    track("button_clicked", {
      button: "pull to refresh",
    });
  }, []);

  const [refreshControlVisible, setRefreshControlVisible] = useState(false);
  const handlePullToRefresh = useCallback(() => {
    refetch();
    setRefreshControlVisible(true);
    trackPullToRefresh();
  }, [refetch, trackPullToRefresh]);

  useEffect(() => {
    if (refreshControlVisible && !loading) setRefreshControlVisible(false);
  }, [refreshControlVisible, loading]);

  return { handlePullToRefresh, refreshControlVisible };
}

export default usePullToRefresh;
