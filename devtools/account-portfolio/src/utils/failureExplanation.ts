import type { AccountPortfolioAction, AccountPortfolioResult } from "../types";

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

/** The HTTP status of a failed call, when the server answered. */
export function httpStatusOf(result: AccountPortfolioResult): number | undefined {
  const body = record(result.body);
  if (typeof body.status === "number") return body.status;
  // A non-JSON body is `PARSING_ERROR` and keeps the real status on `originalStatus`.
  if (typeof body.originalStatus === "number") return body.originalStatus;
  // A schema mismatch is a `CUSTOM_ERROR` and keeps the real status on `data.httpStatus`.
  const httpStatus = record(body.data).httpStatus;
  return typeof httpStatus === "number" ? httpStatus : undefined;
}

const textOf = (value: unknown): string => (typeof value === "string" ? value : "");

function notFound(action: AccountPortfolioAction): string {
  if (action === "createPortfolio") return "Not found: this route does not exist on the server.";
  if (action === "addAddresses") {
    return "Not found: the portfolio or the account does not exist. Use the account id Get portfolio lists, such as base:0x…";
  }
  return "Not found. The portfolio probably does not exist yet: create it first (Portfolio tab).";
}

function rejected(body: Record<string, unknown>): string {
  const detail = textOf(record(body.data).message);
  const reason = detail ? `It says: ${detail}` : "Check the sent body.";
  return `The server rejected the request, and nothing was saved: it validates the whole body, so one bad entry fails every entry. ${reason}`;
}

function serverFailed(body: Record<string, unknown>): string {
  const details = textOf(record(body.data).details);
  const reason = details ? ` It says: ${details}` : "";
  return `The service failed on its side.${reason}`;
}

/** A plain-language reading of a failure, or undefined when the call succeeded. */
export function explainFailure(
  action: AccountPortfolioAction,
  result: AccountPortfolioResult,
): string | undefined {
  if (result.ok) return undefined;
  const body = record(result.body);
  const status = httpStatusOf(result);
  const message = textOf(body.error) || textOf(body.message);

  if (body.status === "CUSTOM_ERROR" && message.includes("empty")) {
    return "The service is disabled: PORTFOLIO_SERVICE_URL is empty.";
  }
  if (body.status === "FETCH_ERROR") {
    return "The request got no answer at all. Nothing is listening at the URL above (PORTFOLIO_SERVICE_URL is wrong, or there is no network or VPN). Open the Network tab of the window's devtools to see the failed request.";
  }
  if (body.status === "PARSING_ERROR") {
    return "The server answered, but not with JSON.";
  }
  const issues = record(body.data).issues ?? body.issues;
  if (body.name === "ZodError" || Array.isArray(issues)) {
    return "The server answered, but the response does not match the schema in @domain/api-account-portfolio. The contract drifted, or the schema is wrong: compare the raw JSON below.";
  }
  if (body.name === "SyntaxError") {
    return "A field that should hold JSON does not, so nothing was sent.";
  }
  if (status === 404) return notFound(action);
  if (status === 400) return rejected(body);
  if (status === 429) return "Rate limited by the service. Retry in a moment.";
  if (status !== undefined && status >= 500) return serverFailed(body);
  return undefined;
}
