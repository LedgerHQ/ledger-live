import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { setSidebarCollapsed } from "~/renderer/actions/settings";
import { HIDE_BAR_THRESHOLD } from "~/renderer/screens/dashboard/AssetDistribution/constants";

export function useSideBarAutoCollapse(collapsed: boolean) {
  const dispatch = useDispatch();
  const wasNarrowRef = useRef<boolean | null>(null);
  const autoCollapsedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      const isNarrow = window.innerWidth <= HIDE_BAR_THRESHOLD;
      if (wasNarrowRef.current === isNarrow) return;

      const wasNarrow = wasNarrowRef.current;
      wasNarrowRef.current = isNarrow;

      if (isNarrow && !collapsed) {
        autoCollapsedRef.current = true;
        dispatch(setSidebarCollapsed(true));
        return;
      }

      if (!isNarrow && wasNarrow && autoCollapsedRef.current) {
        autoCollapsedRef.current = false;
        dispatch(setSidebarCollapsed(false));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [collapsed, dispatch]);

  const setCollapsedByUser = useCallback(
    (isCollapsed: boolean) => {
      autoCollapsedRef.current = false;
      dispatch(setSidebarCollapsed(isCollapsed));
    },
    [dispatch],
  );

  return setCollapsedByUser;
}
