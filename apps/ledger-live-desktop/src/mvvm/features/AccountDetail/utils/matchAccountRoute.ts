import { matchPath } from "react-router";
import type { AccountRouteParams } from "./getAccountRouteSegments";

export const ACCOUNT_ROUTE_PATHS = ["/account/:parentId/:id/*", "/account/:id/*"] as const;

export function matchAccountRoute(pathname: string): AccountRouteParams {
  for (const path of ACCOUNT_ROUTE_PATHS) {
    const match = matchPath(path, pathname);
    if (match) return match.params;
  }
  return {};
}
