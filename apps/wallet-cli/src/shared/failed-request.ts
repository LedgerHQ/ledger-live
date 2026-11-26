type NoAnswerCause = { kind: "timeout" | "untrusted-certificate"; code: string };
export type FailedRequest = {
  host: string;
  status: number | undefined;
  noAnswerCause?: NoAnswerCause;
};

const MAX_CAUSE_DEPTH = 8;
const REQUEST_LINES_IN_MESSAGE = /\b(?:GET|POST|PUT|PATCH|DELETE) (https?:\/\/[^\s"'<>]+)/g;
const STATUS_IN_MESSAGE = /\bstatus code (\d{3})\b/;
const LEDGER_HOST = /(?:^|\.)ledger\.com$/;
const SANDBOX_DENIAL_STATUS = 403;
const TIMEOUT_CODE = /^(?:ECONNABORTED|ETIMEDOUT|ERR_TLS_HANDSHAKE_TIMEOUT|TimeoutError)$/;
const UNTRUSTED_CERTIFICATE_CODE =
  /^(?:CERT_|UNABLE_TO_|ERR_TLS_CERT_ALTNAME_INVALID$|DEPTH_ZERO_SELF_SIGNED_CERT$|SELF_SIGNED_CERT_IN_CHAIN$)/;
const HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const HTTP_AND_SOCKET_PROTOCOLS = new Set([...HTTP_PROTOCOLS, "ws:", "wss:"]);

function propertyOf(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function hostOf(url: unknown, base?: unknown, protocols = HTTP_PROTOCOLS): string | undefined {
  if (typeof url !== "string") return undefined;
  try {
    const parsed = new URL(url, typeof base === "string" ? base : undefined);
    return protocols.has(parsed.protocol) ? parsed.hostname : undefined;
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

  // Only a socket that never opened names its host: an HSM error on an open one has the url too.
  const urlProtocols =
    propertyOf(error, "name") === "WebsocketConnectionError"
      ? HTTP_AND_SOCKET_PROTOCOLS
      : HTTP_PROTOCOLS;
  // Bun puts the url of a fetch that got no answer on `path`.
  const fieldHost =
    hostOf(propertyOf(error, "url"), undefined, urlProtocols) ?? hostOf(propertyOf(error, "path"));
  return fieldHost
    ? {
        host: fieldHost,
        status: numberOrUndefined(propertyOf(error, "httpStatus") ?? propertyOf(error, "status")),
      }
    : undefined;
}

// A message can quote a server, so only a Ledger host is read from it: the hint asks to allow it.
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

// A timeout or a TLS failure is not reliably a sandbox block, so its hint asks for no allowlist change.
function noAnswerCauseOf(chain: unknown[]): NoAnswerCause | undefined {
  for (const node of chain) {
    for (const code of [propertyOf(node, "code"), propertyOf(node, "name")]) {
      if (typeof code !== "string") continue;
      if (TIMEOUT_CODE.test(code)) return { kind: "timeout", code };
      if (UNTRUSTED_CERTIFICATE_CODE.test(code)) return { kind: "untrusted-certificate", code };
    }
  }
  return undefined;
}

function requestIn(chain: unknown[]): FailedRequest | undefined {
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

export function findFailedRequest(error: unknown): FailedRequest | undefined {
  const chain = causeChain(error);
  const request = requestIn(chain);
  if (request === undefined || request.status !== undefined) return request;
  const noAnswerCause = noAnswerCauseOf(chain);
  return noAnswerCause ? { ...request, noAnswerCause } : request;
}

export function failedRequestHint({ host, status, noAnswerCause }: FailedRequest): string {
  if (noAnswerCause?.kind === "timeout") {
    return `${host} did not answer in time (${noAnswerCause.code}).`;
  }
  if (noAnswerCause?.kind === "untrusted-certificate") {
    return `The TLS certificate of ${host} is not trusted (${noAnswerCause.code}).`;
  }
  const allowHost = `If wallet-cli runs in a sandbox, allow ${host} in its network allowlist.`;
  if (status === undefined) return `Could not reach ${host}. ${allowHost}`;
  if (status === SANDBOX_DENIAL_STATUS) {
    return `The request to ${host} was refused (HTTP ${status}). ${allowHost}`;
  }
  return `Request to ${host} failed with HTTP ${status}.`;
}
