import { randomUUID } from "node:crypto";
import { ExclusiveLockStoreFatalError } from "../errors";
import { signS3Request, type S3Credentials } from "./sigv4";
import type { LockRecord, LockStore } from "./types";

export type R2LockStoreConfig = {
  readonly endpoint: string;
  readonly bucket: string;
  readonly prefix: string;
  readonly credentials: S3Credentials;
  readonly requestTimeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => Date;
};

const R2_REGION = "auto";
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const PRECONDITION_LOST_STATUSES = new Set([409, 412]);

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

// Cloudflare weakens the ETag of a response it compresses, and If-Match never matches a weak one.
const strongEtag = (etag: string) => etag.replace(/^W\//, "");

const isLockRecord = (value: unknown): value is LockRecord => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.holder === "string" &&
    typeof record.label === "string" &&
    typeof record.leaseMs === "number" &&
    typeof record.settleMs === "number" &&
    typeof record.released === "boolean"
  );
};

const parseLockRecord = (text: string): LockRecord | undefined => {
  try {
    const parsed: unknown = JSON.parse(text);
    return isLockRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const requiredHeader = (response: Response, name: string) => {
  const value = response.headers.get(name);
  if (!value) {
    throw new ExclusiveLockStoreFatalError(
      `[exclusiveLock] R2 response is missing the "${name}" header`,
    );
  }
  return value;
};

const r2Error = async (method: string, url: URL, response: Response) => {
  const message = `[exclusiveLock] R2 ${method} ${url.pathname} failed with ${response.status}: ${(await response.text()).slice(0, 500)}`;
  return isRetryableStatus(response.status)
    ? new Error(message)
    : new ExclusiveLockStoreFatalError(message);
};

export function createR2LockStore(config: R2LockStoreConfig): LockStore {
  const fetchImpl = config.fetchImpl ?? fetch;
  const now = config.now ?? (() => new Date());
  const requestTimeoutMs = config.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const origin = /^https?:\/\//.test(config.endpoint)
    ? config.endpoint
    : `https://${config.endpoint}`;

  const objectUrl = (key: string) =>
    new URL(
      `/${config.bucket}/${config.prefix}${Buffer.from(key, "utf8").toString("base64url")}.json`,
      origin,
    );

  const send = (method: "GET" | "PUT", url: URL, headers: Record<string, string>, body = "") =>
    fetchImpl(url, {
      method,
      headers: {
        "accept-encoding": "identity",
        ...headers,
        ...signS3Request({
          method,
          url,
          headers,
          body,
          region: R2_REGION,
          credentials: config.credentials,
          now: now(),
        }),
      },
      body: method === "PUT" ? body : undefined,
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

  const conditionalPut = async (
    key: string,
    record: LockRecord,
    condition: Record<string, string>,
  ) => {
    const url = objectUrl(key);
    // R2's ETag is the body's MD5: identical renewals would keep it, letting a stale If-Match win.
    const uniqueBody = JSON.stringify({ ...record, writeId: randomUUID() });
    const response = await send(
      "PUT",
      url,
      { "content-type": "application/json", ...condition },
      uniqueBody,
    );
    if (response.ok) return strongEtag(requiredHeader(response, "etag"));
    if (PRECONDITION_LOST_STATUSES.has(response.status)) return undefined;
    throw await r2Error("PUT", url, response);
  };

  return {
    async read(key) {
      const url = objectUrl(key);
      const response = await send("GET", url, {});
      if (response.status === 404) return undefined;
      if (!response.ok) throw await r2Error("GET", url, response);

      const record = parseLockRecord(await response.text());
      if (!record) {
        throw new ExclusiveLockStoreFatalError(
          `[exclusiveLock] R2 object ${url.pathname} is not a lock record`,
        );
      }
      const ageMs =
        Date.parse(requiredHeader(response, "date")) -
        Date.parse(requiredHeader(response, "last-modified"));
      if (!Number.isFinite(ageMs)) {
        throw new ExclusiveLockStoreFatalError(
          `[exclusiveLock] R2 object ${url.pathname} came with an unreadable Date or Last-Modified header`,
        );
      }
      return { record, etag: strongEtag(requiredHeader(response, "etag")), ageMs };
    },
    create: (key, record) => conditionalPut(key, record, { "if-none-match": "*" }),
    replace: (key, record, etag) => conditionalPut(key, record, { "if-match": etag }),
  };
}
