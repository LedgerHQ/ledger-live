import type { AccountPortfolioAction, AccountPortfolioResult } from "../types";

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

/** The HTTP status of a failed call, when the server answered. */
export function httpStatusOf(result: AccountPortfolioResult): number | undefined {
  const body = record(result.body);
  if (typeof body.status === "number") return body.status;
  // A non-JSON body is `PARSING_ERROR` and keeps the real status on `originalStatus`.
  return typeof body.originalStatus === "number" ? body.originalStatus : undefined;
}

/** A plain-language reading of a failure, or undefined when the call succeeded. */
export function explainFailure(
  action: AccountPortfolioAction,
  result: AccountPortfolioResult,
): string | undefined {
  if (result.ok) return undefined;
  const body = record(result.body);
  const status = httpStatusOf(result);
  const message = String(body.error ?? body.message ?? "");

  if (body.status === "CUSTOM_ERROR" && message.includes("empty")) {
    return "The service is disabled: PORTFOLIO_SERVICE_URL was empty when the app was built. Set it in apps/ledger-live-desktop/.env and restart the dev server.";
  }
  if (body.status === "FETCH_ERROR") {
    return "The request got no answer at all. Either the browser blocked it (CORS: the service sends no Access-Control-Allow-Origin header and rejects the OPTIONS preflight, which the dev server proxy is meant to avoid), or nothing is listening at the URL above (dev server started without PORTFOLIO_SERVICE_URL, or no network or VPN). Open the Network tab of the window's devtools to tell them apart.";
  }
  if (body.status === "PARSING_ERROR") {
    return "The server answered, but not with JSON.";
  }
  if (body.name === "ZodError" || Array.isArray(body.issues)) {
    return "The server answered, but the response does not match the schema in @domain/api-account-portfolio. The contract drifted, or the schema is wrong: compare the raw JSON below.";
  }
  if (body.name === "SyntaxError") {
    return "A field that should hold JSON does not, so nothing was sent.";
  }
  if (status === 404) {
    if (action === "createPortfolio") return "Not found: this route does not exist on the server.";
    if (action === "addAddresses") {
      return "Not found: the portfolio or the account does not exist. Use the account id Get portfolio lists, such as base:0x…";
    }
    return "Not found. The portfolio probably does not exist yet: create it first (Manage tab).";
  }
  if (status === 400) {
    const detail = record(body.data).message;
    return `The server rejected the request, and nothing was saved: it validates the whole body, so one bad entry fails every entry. ${typeof detail === "string" ? `It says: ${detail}` : "Check the sent body."}`;
  }
  if (status === 429) return "Rate limited by the service. Retry in a moment.";
  if (status !== undefined && status >= 500) {
    const details = record(body.data).details;
    return `The service failed on its side.${typeof details === "string" ? ` It says: ${details}` : ""}`;
  }
  return undefined;
}
