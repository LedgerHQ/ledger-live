import { useState, useCallback, useEffect, useRef } from "react";
import { track } from "~/analytics";

interface UsePullToRefreshProps {
  loading: boolean;
  refetch: () => void;
}

function usePullToRefresh({ loading, refetch }: UsePullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasStartedLoading = useRef(false);

  const handlePullToRefresh = useCallback(() => {
    track("button_clicked", { button: "pull to refresh" });
    setIsRefreshing(true);
    hasStartedLoading.current = false;
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!isRefreshing) return;

    if (loading) {
      hasStartedLoading.current = true;
    }

    if (hasStartedLoading.current && !loading) {
      setIsRefreshing(false);
      return;
    }

    const timeout = setTimeout(() => setIsRefreshing(false), 500); // If loading never starts
    return () => clearTimeout(timeout);
  }, [loading, isRefreshing]);

  return {
    handlePullToRefresh,
    refreshControlVisible: isRefreshing || loading,
  };
}

export default usePullToRefresh;
