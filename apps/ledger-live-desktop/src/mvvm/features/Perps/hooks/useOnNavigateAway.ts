import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

export function useOnNavigateAway(isActive: boolean, onNavigateAway: () => void): void {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (isActive) onNavigateAway();
  }, [isActive, onNavigateAway, pathname]);
}
