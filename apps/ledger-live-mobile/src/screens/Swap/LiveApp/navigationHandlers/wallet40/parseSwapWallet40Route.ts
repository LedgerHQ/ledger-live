import { SwapWallet40ParsedRoute } from "./types";

const HOME_ROUTE: SwapWallet40ParsedRoute = {
  routeName: "home",
  headerStyle: "transparent",
  titleKey: null,
};

const UNKNOWN_ROUTE: SwapWallet40ParsedRoute = {
  routeName: "unknown",
  headerStyle: "transparent",
  titleKey: null,
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * Parses the current Swap webview URL into the wallet40 header configuration.
 *
 * Expected URL format:
 * - Any valid absolute URL string accepted by the `URL` constructor.
 * - Host/domain is ignored; only `pathname` and specific query parameters are used.
 *
 * Supported query parameters:
 * - `tab`: on `/`, `tab=QUOTES_LIST` maps to quotes list header state.
 * - `transactionStatus`: on `/multi-step-transaction`, `transactionStatus=complete`
 *   maps to the completed two-step title key.
 *
 * Header mapping:
 * - `/` + `tab=QUOTES_LIST` -> `quotesList`, opaque header, quotes title
 * - `/` (any other tab/missing tab) -> `home`, transparent header, no title
 * - `/multi-step-transaction` -> `multiStepTransaction`, opaque header, two-step title
 * - `/dev-settings` -> `devSettings`, opaque header, Dev Settings title
 * - unknown/invalid URL -> `unknown`, transparent header, no title (safe fallback)
 *
 * Examples:
 * - `https://swap.live.app/?tab=QUOTES_LIST`
 *   -> `{ routeName: "quotesList", headerStyle: "opaque", titleKey: "transfer.swap2.quotesList.title" }`
 * - `https://swap.live.app/multi-step-transaction?transactionStatus=complete`
 *   -> `{ routeName: "multiStepTransaction", headerStyle: "opaque", titleKey: "transfer.swap2.twoStepApproval.completedTitle" }`
 * - `https://swap.live.app/anything-else`
 *   -> `{ routeName: "unknown", headerStyle: "transparent", titleKey: null }`
 */
export function parseSwapWallet40Route(url: string): SwapWallet40ParsedRoute {
  if (!url) return UNKNOWN_ROUTE;

  try {
    const parsedUrl = new URL(url);
    const pathname = normalizePathname(parsedUrl.pathname);

    if (pathname === "/") {
      const tab = parsedUrl.searchParams.get("tab");
      if (tab === "QUOTES_LIST") {
        return {
          routeName: "quotesList",
          headerStyle: "opaque",
          titleKey: "transfer.swap2.quotesList.title",
        };
      }

      return HOME_ROUTE;
    }

    if (pathname === "/multi-step-transaction") {
      const isTransactionComplete = parsedUrl.searchParams.get("transactionStatus") === "complete";

      return {
        routeName: "multiStepTransaction",
        headerStyle: "opaque",
        titleKey: isTransactionComplete
          ? "transfer.swap2.twoStepApproval.completedTitle"
          : "transfer.swap2.twoStepApproval.title",
      };
    }

    if (pathname === "/dev-settings") {
      return {
        routeName: "devSettings",
        headerStyle: "opaque",
        titleKey: "Dev Settings",
      };
    }

    return UNKNOWN_ROUTE;
  } catch {
    return UNKNOWN_ROUTE;
  }
}
