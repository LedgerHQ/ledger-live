import { SIDEBAR_VALUE_TO_PATH, SIDEBAR_SPECIAL_VALUES } from "./constants";
import type { SideBarNavValue, SideBarSpecialValue } from "./constants";

export type SideBarActiveValue = SideBarNavValue | SideBarSpecialValue | "";

export const isSideBarNavValue = (value: string): value is SideBarNavValue =>
  value in SIDEBAR_VALUE_TO_PATH;

/**
 * Resolves current pathname + optional refer path to the active sidebar value.
 * Returns an empty string when the pathname doesn't match any sidebar entry,
 * keeping the Lumen SideBar component in controlled mode at all times.
 */
export function pathnameToActive(
  pathname: string,
  referPath: string | undefined,
): SideBarActiveValue {
  if (referPath && pathname.startsWith(referPath)) return SIDEBAR_SPECIAL_VALUES.refer;
  if (pathname === "/" || pathname.startsWith("/asset/")) return "home";
  if (pathname.startsWith("/account")) return "accounts";
  if (pathname.startsWith("/swap")) return "swap";
  if (pathname === "/earn") return "earn";
  if (pathname.startsWith("/platform")) return "discover";
  if (pathname === "/card-new-wallet" || pathname.startsWith("/card")) return "card";
  return "";
}
