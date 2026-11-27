import { useEffect } from "react";
import { useLocation } from "react-router";
import { startDatadogRouteView } from "./renderer";

export function DatadogRouteViews() {
  const { pathname } = useLocation();

  useEffect(() => {
    startDatadogRouteView(pathname);
  }, [pathname]);

  return null;
}
