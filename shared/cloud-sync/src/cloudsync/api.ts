import { z } from "zod";
import WS from "isomorphic-ws";
import type { WebSocket } from "ws";
import { Observable } from "rxjs";
import { JWT, Trustchain } from "../trustchain-types";

const schemaAtomicGetNoData = z.object({ status: z.literal("no-data") });
const schemaAtomicGetUpToDate = z.object({ status: z.literal("up-to-date") });
const schemaAtomicGetOutOfSync = z.object({
  status: z.literal("out-of-sync"),
  version: z.number(),
  payload: z.string(),
  date: z.string(),
  info: z.string().nullable().optional(),
});
const schemaAtomicGetResponse = z.discriminatedUnion("status", [
  schemaAtomicGetNoData,
  schemaAtomicGetUpToDate,
  schemaAtomicGetOutOfSync,
]);
export type APISyncResponse = z.infer<typeof schemaAtomicGetResponse>;
export type StatusAPIResponse = { name: string; version: string };

const schemaAtomicPostUpdated = z.object({ status: z.literal("updated") });
const schemaAtomicPostOutOfSync = z.object({
  status: z.literal("out-of-sync"),
  version: z.number(),
  payload: z.string(),
  date: z.string(),
  info: z.string().nullable().optional(),
});
const schemaAtomicPostResponse = z.discriminatedUnion("status", [
  schemaAtomicPostUpdated,
  schemaAtomicPostOutOfSync,
]);
export type APISyncUpdateResponse = z.infer<typeof schemaAtomicPostResponse>;

/**
 * Satisfies the error contract documented in @ledgerhq/ledger-key-ring-protocol's `auth.ts`:
 * a numeric `status` plus the backend's verbatim `message`. Both are required for JWT recovery —
 * dropping either turns a recoverable expired token into a surfaced 401.
 */
export class CloudSyncHttpError extends Error {
  override name = "CloudSyncHttpError";
  readonly status: number;
  readonly url: string;
  readonly method: string;
  constructor(message: string, fields: { status: number; url: string; method: string }) {
    super(message);
    this.status = fields.status;
    this.url = fields.url;
    this.method = fields.method;
  }
}

function getErrorMessage(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data;
  if (typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const errors = record.errors;
  if (Array.isArray(errors) && errors.length > 0) return getErrorMessage(errors[0]);
  for (const key of ["message", "error_message", "error", "msg"]) {
    const value = record[key];
    if (typeof value === "string") return value;
  }
  return undefined;
}

function extractServerMessage(body: string): string | undefined {
  if (!body) return undefined;
  try {
    const data: unknown = JSON.parse(body);
    return getErrorMessage(Array.isArray(data) ? data[0] : data);
  } catch {
    return body;
  }
}

async function makeHttpError(res: Response, url: string, method: string) {
  let body = "";
  try {
    body = await res.text();
  } catch {
    body = "";
  }
  const message =
    extractServerMessage(body) ?? `HTTP ${res.status} ${res.statusText} on ${method} ${url}`;
  return new CloudSyncHttpError(message, { status: res.status, url, method });
}

async function apiFetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw await makeHttpError(res, url, init.method ?? "GET");
  }
  return res.json() as Promise<T>;
}

export function getCloudSyncApi(apiBaseURL: string) {
  async function fetchData(
    jwt: JWT,
    datatype: string,
    version: number | undefined,
    trustchain: Trustchain,
  ): Promise<APISyncResponse> {
    const params = new URLSearchParams({
      path: trustchain.applicationPath,
      id: trustchain.rootId,
    });
    if (version !== undefined) params.set("version", String(version));
    const data = await apiFetch<unknown>(
      `${apiBaseURL}/atomic/v1/${datatype}?${params.toString()}`,
      { method: "GET", headers: { Authorization: `Bearer ${jwt.accessToken}` } },
    );
    return schemaAtomicGetResponse.parse(data);
  }

  async function uploadData(
    jwt: JWT,
    datatype: string,
    version: number,
    payload: string,
    trustchain: Trustchain,
  ): Promise<APISyncUpdateResponse> {
    const params = new URLSearchParams({
      version: String(version),
      path: trustchain.applicationPath,
      id: trustchain.rootId,
    });
    const data = await apiFetch<unknown>(
      `${apiBaseURL}/atomic/v1/${datatype}?${params.toString()}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload }),
      },
    );
    return schemaAtomicPostResponse.parse(data);
  }

  async function deleteData(jwt: JWT, datatype: string, trustchain: Trustchain): Promise<void> {
    const params = new URLSearchParams({
      path: trustchain.applicationPath,
      id: trustchain.rootId,
    });
    const url = `${apiBaseURL}/atomic/v1/${datatype}?${params.toString()}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt.accessToken}` },
    });
    if (!res.ok) throw await makeHttpError(res, url, "DELETE");
  }

  function listenNotifications(
    getFreshJwt: () => Promise<JWT>,
    datatype: string,
  ): Observable<number> {
    const url = `${apiBaseURL.replace(/^http/, "ws")}/atomic/v1/${datatype}/notifications`;
    const ws: WebSocket = new WS(url);
    return new Observable(observer => {
      function sendJwt() {
        getFreshJwt()
          .then(jwt => ws.send(jwt.accessToken))
          .catch(error => {
            observer.error(error);
            ws.close();
          });
      }
      ws.addEventListener("message", e => {
        const data = e.data.toString();
        if (data === "ping") ws.send("pong");
        else if (data === "JWT expired") sendJwt();
        else {
          const possiblyNumber = parseInt(data, 10);
          if (!Number.isNaN(possiblyNumber)) observer.next(possiblyNumber);
          else console.warn("cloudsync: unexpected message", data);
        }
      });
      ws.addEventListener("close", () => observer.complete());
      ws.addEventListener("error", error => observer.error(error));
      ws.addEventListener("open", () => {
        sendJwt();
      });
      return () => ws.close();
    });
  }

  async function fetchStatus(): Promise<StatusAPIResponse> {
    const data = await apiFetch<StatusAPIResponse>(`${apiBaseURL}/_info`, { method: "GET" });
    return data;
  }

  return { fetchData, uploadData, deleteData, listenNotifications, fetchStatus };
}
