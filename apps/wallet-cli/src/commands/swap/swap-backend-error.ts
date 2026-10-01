import { getSwapAPIError } from "@ledgerhq/live-common/exchange/swap/index";

export class SwapBackendError extends Error {
  override name = "SwapBackendError";

  constructor(
    message: string,
    readonly httpStatus: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

type HttpErrorResponse = { status: number; data?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function httpResponseOf(error: unknown): HttpErrorResponse | undefined {
  const response = isRecord(error) ? error.response : undefined;
  return isRecord(response) && typeof response.status === "number"
    ? (response as HttpErrorResponse)
    : undefined;
}

function backendMessageOf(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  if (typeof body.error === "string") return body.error;
  if (isRecord(body.error) && typeof body.error.message === "string") return body.error.message;
  if (typeof body.errorMessage === "string") return body.errorMessage;
  if (typeof body.message === "string") return body.message;
  return undefined;
}

const PROVIDER_REJECTED = "The swap provider rejected the request";
const SERVICE_UNAVAILABLE = "The swap service is temporarily unavailable, try again later.";

function messageFor(status: number, backendMessage: string | undefined): string {
  const isTransient = status === 429 || status >= 500;
  if (isTransient) return SERVICE_UNAVAILABLE;
  return backendMessage ? `${PROVIDER_REJECTED}: ${backendMessage}` : `${PROVIDER_REJECTED}.`;
}

export function toSwapBackendError(error: unknown): Error | undefined {
  const response = httpResponseOf(error);
  if (!response) return undefined;

  const body = response.data;
  const backendMessage = backendMessageOf(body);
  if (isRecord(body) && typeof body.errorCode === "number") {
    const mapped = getSwapAPIError(body.errorCode, backendMessage);
    if (mapped.name !== "Error") {
      mapped.cause = error;
      return mapped;
    }
  }

  return new SwapBackendError(messageFor(response.status, backendMessage), response.status, {
    cause: error,
  });
}
