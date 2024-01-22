import { useState, useCallback, useEffect } from "react";

interface UsePullToRefreshProps {
  loading: boolean;
  refresh: () => void;
}
function usePullToRefresh({ loading, refresh }: UsePullToRefreshProps) {
  const [refreshControlVisible, setRefreshControlVisible] = useState(false);
  const handlePullToRefresh = useCallback(() => {
    refresh();
    setRefreshControlVisible(true);
  }, [refresh]);

  useEffect(() => {
    if (refreshControlVisible && !loading) setRefreshControlVisible(false);
  }, [refreshControlVisible, loading]);

  return { handlePullToRefresh, refreshControlVisible };
}

export default usePullToRefresh;
