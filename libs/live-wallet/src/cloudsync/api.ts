import z from "zod";
import network from "@ledgerhq/live-network";
import WS from "isomorphic-ws";
import querystring from "querystring";
import type { WebSocket } from "ws";
import { Observable } from "rxjs";
import { Trustchain } from "@ledgerhq/trustchain/types";

export type JWT = {
  accessToken: string;
};

const schemaAtomicGetNoData = z.object({
  status: z.literal("no-data"),
});
const schemaAtomicGetUpToDate = z.object({
  status: z.literal("up-to-date"),
});
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

export type StatusAPIResponse = {
  name: string;
  version: string;
};

const schemaAtomicPostUpdated = z.object({
  status: z.literal("updated"),
});
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

function getApi(apiBaseURL: string) {
  // Fetch data status from cloud
  async function fetchData(
    jwt: JWT,
    datatype: string,
    version: number | undefined,
    trustchain: Trustchain,
  ): Promise<APISyncResponse> {
    const query = {
      path: trustchain.applicationPath,
      id: trustchain.rootId,
    };
    const { data } = await network<unknown>({
      url: `${apiBaseURL}/atomic/v1/${datatype}?${querystring.stringify(query)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
      },
      params: version !== undefined ? { version } : {},
    });
    return schemaAtomicGetResponse.parse(data);
  }

  // Upload new version of data to cloud
  async function uploadData(
    jwt: JWT,
    datatype: string,
    version: number,
    payload: string,
    trustchain: Trustchain,
  ): Promise<APISyncUpdateResponse> {
    const query = {
      version,
      path: trustchain.applicationPath,
      id: trustchain.rootId,
    };
    const { data } = await network<unknown>({
      url: `${apiBaseURL}/atomic/v1/${datatype}?${querystring.stringify(query)}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        payload,
      },
    });
    return schemaAtomicPostResponse.parse(data);
  }

  // Delete data from cloud
  async function deleteData(jwt: JWT, datatype: string, trustchain: Trustchain): Promise<void> {
    const query = {
      path: trustchain.applicationPath,
      id: trustchain.rootId,
    };
    await network<void>({
      url: `${apiBaseURL}/atomic/v1/${datatype}?${querystring.stringify(query)}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt.accessToken}`,
      },
    });
  }

  function listenNotifications(
    getFreshJwt: () => Promise<JWT>,
    datatype: string,
  ): Observable<number> {
    const url = `${apiBaseURL.replace("http", "ws")}/atomic/v1/${datatype}/notifications`;
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
        if (data === "ping") {
          ws.send("pong");
        } else if (data === "JWT expired") {
          sendJwt();
        } else {
          const possiblyNumber = parseInt(data, 10);
          if (!isNaN(possiblyNumber)) {
            observer.next(possiblyNumber);
          } else {
            console.warn("cloudsync: unexpected message", data);
          }
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
    const { data } = await network<StatusAPIResponse>({
      url: `${apiBaseURL}/_info`,
      method: "GET",
    });
    return data;
  }

  return {
    fetchData,
    uploadData,
    deleteData,
    listenNotifications,
    fetchStatus,
  };
}

export default getApi;
