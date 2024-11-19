import { useState, useCallback, useEffect } from "react";
import { track } from "~/analytics";

interface UsePullToRefreshProps {
  loading: boolean;
  refresh: () => void;
}

function usePullToRefresh({ loading, refresh }: UsePullToRefreshProps) {
  const trackPullToRefresh = useCallback(() => {
    track("button_clicked", {
      button: "pull to refresh",
    });
  }, []);

  const [refreshControlVisible, setRefreshControlVisible] = useState(false);
  const handlePullToRefresh = useCallback(() => {
    refresh();
    setRefreshControlVisible(true);
    trackPullToRefresh();
  }, [refresh, trackPullToRefresh]);

  useEffect(() => {
    if (refreshControlVisible && !loading) setRefreshControlVisible(false);
  }, [refreshControlVisible, loading]);

  return { handlePullToRefresh, refreshControlVisible };
}

export default usePullToRefresh;
