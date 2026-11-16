export type FailedRequest = { host: string; status: number | undefined };

const MAX_CAUSE_DEPTH = 8;
const REQUEST_LINE_IN_MESSAGE = /\b(?:GET|POST|PUT|PATCH|DELETE) (https?:\/\/[^\s"'<>]+)/;
const STATUSES_A_PROXY_DENIAL_CAN_HAVE = new Set([403, 407]);

function propertyOf(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function hostOf(url: unknown, base?: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  try {
    const parsed = new URL(url, typeof base === "string" ? base : undefined);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.hostname
      : undefined;
  } catch {
    return undefined;
  }
}

function requestOf(error: unknown): FailedRequest | undefined {
  const config = propertyOf(error, "config");
  const axiosHost = hostOf(propertyOf(config, "url"), propertyOf(config, "baseURL"));
  if (axiosHost) {
    return {
      host: axiosHost,
      status: numberOrUndefined(propertyOf(propertyOf(error, "response"), "status")),
    };
  }

  const fieldHost = hostOf(propertyOf(error, "url"));
  if (fieldHost) return { host: fieldHost, status: numberOrUndefined(propertyOf(error, "status")) };

  const message = propertyOf(error, "message");
  const requestLine = typeof message === "string" ? REQUEST_LINE_IN_MESSAGE.exec(message) : null;
  const messageHost = hostOf(requestLine?.[1]);
  return messageHost ? { host: messageHost, status: undefined } : undefined;
}

export function findFailedRequest(error: unknown): FailedRequest | undefined {
  let node = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && node !== undefined; depth++) {
    const request = requestOf(node);
    if (request) return request;
    node = propertyOf(node, "cause");
  }
  return undefined;
}

export function failedRequestHint({ host, status }: FailedRequest): string {
  const mayBeSandboxDenial = status === undefined || STATUSES_A_PROXY_DENIAL_CAN_HAVE.has(status);
  return mayBeSandboxDenial
    ? `Could not reach ${host}. If wallet-cli runs in a sandbox, allow ${host} in its network allowlist.`
    : `Request to ${host} failed with HTTP ${status}.`;
}
