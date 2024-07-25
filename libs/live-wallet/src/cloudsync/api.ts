import z from "zod";
import network from "@ledgerhq/live-network";
import WS from "isomorphic-ws";
import type { WebSocket } from "ws";
import { getEnv } from "@ledgerhq/live-env";
import { Observable } from "rxjs";

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

const schemaAtomicPostUpdated = z.object({
  status: z.literal("updated"),
});
const schemaAtomicPostOutOfSync = z.object({
  status: z.literal("out-of-sync"),
  version: z.number(),
  payload: z.string(),
  date: z.string(),
  info: z.string().optional(),
});
const schemaAtomicPostResponse = z.discriminatedUnion("status", [
  schemaAtomicPostUpdated,
  schemaAtomicPostOutOfSync,
]);

export type APISyncUpdateResponse = z.infer<typeof schemaAtomicPostResponse>;

// Fetch data status from cloud
async function fetchData(
  jwt: JWT,
  datatype: string,
  version: number | undefined,
  applicationPath: string,
): Promise<APISyncResponse> {
  const { data } = await network<unknown>({
    url: `${getEnv("CLOUD_SYNC_API")}/atomic/v1/${datatype}?path=${encodeURIComponent(applicationPath)}`,
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
  applicationPath: string,
): Promise<APISyncUpdateResponse> {
  const { data } = await network<unknown>({
    url: `${getEnv("CLOUD_SYNC_API")}/atomic/v1/${datatype}?version=${version}&path=${encodeURIComponent(applicationPath)}`,
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
async function deleteData(jwt: JWT, datatype: string, applicationPath: string): Promise<void> {
  await network<void>({
    url: `${getEnv("CLOUD_SYNC_API")}/atomic/v1/${datatype}?path=${encodeURIComponent(applicationPath)}`,
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
  const url = `${getEnv("CLOUD_SYNC_API").replace("http", "ws")}/atomic/v1/${datatype}/notifications`;
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

export default {
  fetchData,
  uploadData,
  deleteData,
  listenNotifications,
};
