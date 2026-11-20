export type FailedRequest = { host: string; status: number | undefined };

const MAX_CAUSE_DEPTH = 8;
const REQUEST_LINES_IN_MESSAGE = /\b(?:GET|POST|PUT|PATCH|DELETE) (https?:\/\/[^\s"'<>]+)/g;
const STATUS_IN_MESSAGE = /\bstatus code (\d{3})\b/;
const LEDGER_HOST = /(?:^|\.)ledger\.com$/;
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

function requestFromFields(error: unknown): FailedRequest | undefined {
  const config = propertyOf(error, "config");
  const axiosHost = hostOf(propertyOf(config, "url"), propertyOf(config, "baseURL"));
  if (axiosHost) {
    return {
      host: axiosHost,
      status: numberOrUndefined(propertyOf(propertyOf(error, "response"), "status")),
    };
  }

  // Bun puts the url of a fetch that got no answer on `path`.
  const fieldHost = hostOf(propertyOf(error, "url")) ?? hostOf(propertyOf(error, "path"));
  return fieldHost
    ? { host: fieldHost, status: numberOrUndefined(propertyOf(error, "status")) }
    : undefined;
}

// A message can quote what a server sent, so only a Ledger host is read from it: the hint asks
// the human to allow that host.
function requestFromMessage(error: unknown): FailedRequest | undefined {
  const message = propertyOf(error, "message");
  if (typeof message !== "string") return undefined;
  // The last request line: an HTTP client appends the real url after the server's status text.
  const host = hostOf([...message.matchAll(REQUEST_LINES_IN_MESSAGE)].at(-1)?.[1]);
  if (!host || !LEDGER_HOST.test(host)) return undefined;
  const status = STATUS_IN_MESSAGE.exec(message)?.[1];
  return { host, status: status ? Number(status) : undefined };
}

function causeChain(error: unknown): unknown[] {
  const chain: unknown[] = [];
  for (let node = error; node !== undefined && chain.length < MAX_CAUSE_DEPTH;) {
    chain.push(node);
    node = propertyOf(node, "cause");
  }
  return chain;
}

export function findFailedRequest(error: unknown): FailedRequest | undefined {
  const chain = causeChain(error);
  for (const node of chain) {
    const request = requestFromFields(node);
    if (request) return request;
  }
  for (const node of chain) {
    const request = requestFromMessage(node);
    if (request) return request;
  }
  return undefined;
}

export function failedRequestHint({ host, status }: FailedRequest): string {
  const mayBeSandboxDenial = status === undefined || STATUSES_A_PROXY_DENIAL_CAN_HAVE.has(status);
  return mayBeSandboxDenial
    ? `Could not reach ${host}. If wallet-cli runs in a sandbox, allow ${host} in its network allowlist.`
    : `Request to ${host} failed with HTTP ${status}.`;
}
