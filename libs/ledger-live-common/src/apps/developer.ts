import type { App } from "@ledgerhq/types-live";

/**
 * Who develops an app, as shown to the user in My Ledger.
 * - "ledger": developed by Ledger
 * - "community": developed by anyone else (third party, partner, agency)
 */
export type AppDeveloperType = "ledger" | "community";

/** The authorName the Manager API returns for apps developed by Ledger. */
export const LEDGER_APP_AUTHOR_NAME = "Ledger";

/**
 * Classifies an app from the authorName returned by the Manager API.
 *
 * Only an exact "Ledger" (surrounding whitespace ignored) is a Ledger app.
 * Anything else, including an empty or missing authorName, is a community app,
 * so a wrong or missing value errs on the side of showing the community disclaimer.
 */
export function getAppDeveloperType(app: Pick<App, "authorName">): AppDeveloperType {
  return app.authorName?.trim() === LEDGER_APP_AUTHOR_NAME ? "ledger" : "community";
}

export function isLedgerApp(app: Pick<App, "authorName">): boolean {
  return getAppDeveloperType(app) === "ledger";
}

export function isCommunityApp(app: Pick<App, "authorName">): boolean {
  return getAppDeveloperType(app) === "community";
}

/** Developer filter of the My Ledger app catalog. */
export type AppDeveloperFilter = "all" | AppDeveloperType;

export function matchesDeveloperFilter(
  app: Pick<App, "authorName">,
  filter: AppDeveloperFilter = "all",
): boolean {
  return filter === "all" || getAppDeveloperType(app) === filter;
}
