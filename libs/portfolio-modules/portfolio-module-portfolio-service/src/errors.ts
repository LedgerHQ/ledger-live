import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import type { PortfolioErrorType } from "@ledgerhq/portfolio-module-framework";

const TYPE_BY_STATUS = new Map<number, PortfolioErrorType>([
  [400, "BAD_REQUEST"],
  [404, "NOT_FOUND"],
  [405, "METHOD_NOT_ALLOWED"],
  [429, "TOO_MANY_REQUESTS"],
  [503, "UNAVAILABLE"],
]);

const FALLBACK_TYPE: PortfolioErrorType = "INTERNAL_ERROR";

const ERROR_TYPES = new Set<string>([...TYPE_BY_STATUS.values(), FALLBACK_TYPE]);

type ErrorBody = { type?: unknown; message?: unknown; details?: unknown };

const isErrorType = (value: unknown): value is PortfolioErrorType =>
  typeof value === "string" && ERROR_TYPES.has(value);

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value !== "" ? value : undefined;

async function readErrorBody(response: Response): Promise<ErrorBody> {
  try {
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null ? body : {};
  } catch {
    return {};
  }
}

/** The `PortfolioApiError` a non-2xx response of the service stands for. */
export async function toPortfolioApiError(response: Response): Promise<PortfolioApiError> {
  const body = await readErrorBody(response);
  const type = isErrorType(body.type)
    ? body.type
    : (TYPE_BY_STATUS.get(response.status) ?? FALLBACK_TYPE);
  const message =
    nonEmptyString(body.message) ??
    nonEmptyString(response.statusText) ??
    `Portfolio service answered ${response.status}`;
  return new PortfolioApiError(type, message, nonEmptyString(body.details));
}
