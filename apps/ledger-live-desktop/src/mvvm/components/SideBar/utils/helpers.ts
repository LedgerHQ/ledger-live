import { SIDEBAR_VALUE_TO_PATH } from "./constants";
import type { SideBarNavValue } from "./constants";

export type SideBarActiveValue = SideBarNavValue | "";

export const isSideBarNavValue = (value: string): value is SideBarNavValue =>
  value in SIDEBAR_VALUE_TO_PATH;

/**
 * Resolves the current pathname to the active sidebar value.
 * Returns an empty string when the pathname doesn't match any sidebar entry,
 * keeping the Lumen SideBar component in controlled mode at all times.
 */
export function pathnameToActive(pathname: string, search = ""): SideBarActiveValue {
  if (pathname === "/") return "home";
  if (pathname === "/cryptos") return "accounts";
  if (pathname.startsWith("/account")) return "accounts";
  if (pathname.startsWith("/swap")) return "swap";
  if (pathname === "/earn") return "earn";
  if (pathname.startsWith("/platform")) {
    const returnTo = new URLSearchParams(search).get("returnTo");
    return returnTo === SIDEBAR_VALUE_TO_PATH.paytab ? "paytab" : "discover";
  }
  if (pathname.startsWith("/paytab")) return "paytab";
  if (pathname === "/card-new-wallet" || pathname.startsWith("/card")) return "card";
  return "";
}
