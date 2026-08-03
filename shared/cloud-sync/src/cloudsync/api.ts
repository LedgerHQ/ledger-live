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

async function apiFetch<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} on ${init.method} ${url}`);
  }
  return res.json() as Promise<T>;
}

function getApi(apiBaseURL: string) {
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
    const res = await fetch(`${apiBaseURL}/atomic/v1/${datatype}?${params.toString()}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt.accessToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on DELETE`);
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

export default getApi;
