import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import WebSocket from "ws";
import { firstValueFrom, toArray } from "rxjs";
import getApi from "../api";
import type { Trustchain } from "../../trustchain-types";

describe("getApi", () => {
  const port = 54035;
  const base = `http://localhost:${port}`;
  const trustchain: Trustchain = {
    rootId: "root-id",
    applicationPath: "0'/16'/0'",
    walletSyncEncryptionKey: "key",
  };
  const jwt = { accessToken: "mock-jwt" };

  const server = setupServer(
    http.get(`${base}/atomic/v1/:slug`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      if (params.get("id") !== trustchain.rootId) {
        return HttpResponse.json({}, { status: 400 });
      }
      const version = params.get("version");
      if (!version) {
        return HttpResponse.json({
          status: "out-of-sync",
          version: 2,
          payload: "payload",
          date: new Date().toISOString(),
        });
      }
      if (version === "1") {
        return HttpResponse.json({ status: "up-to-date" });
      }
      return HttpResponse.json({ status: "no-data" });
    }),
    http.post(`${base}/atomic/v1/:slug`, async ({ request }) => {
      const body = (await request.json()) as { payload: string };
      return HttpResponse.json({ status: "updated", payload: body.payload });
    }),
    http.delete(`${base}/atomic/v1/:slug`, () => new HttpResponse(null, { status: 204 })),
    http.get(`${base}/_info`, () => HttpResponse.json({ name: "cloud-sync", version: "1.0.0" })),
  );

  beforeAll(() => server.listen());
  afterAll(() => server.close());

  const api = getApi(base);

  it("fetchData without version returns distant payload", async () => {
    const response = await api.fetchData(jwt, "live", undefined, trustchain);
    expect(response.status).toBe("out-of-sync");
    if (response.status === "out-of-sync") {
      expect(response.payload).toBe("payload");
    }
  });

  it("fetchData with version returns up-to-date", async () => {
    const response = await api.fetchData(jwt, "live", 1, trustchain);
    expect(response).toEqual({ status: "up-to-date" });
  });

  it("fetchData with stale version returns no-data", async () => {
    const response = await api.fetchData(jwt, "live", 99, trustchain);
    expect(response).toEqual({ status: "no-data" });
  });

  it("uploadData posts payload with trustchain params", async () => {
    const response = await api.uploadData(jwt, "live", 3, "base64-payload", trustchain);
    expect(response.status).toBe("updated");
  });

  it("deleteData succeeds", async () => {
    await expect(api.deleteData(jwt, "live", trustchain)).resolves.toBeUndefined();
  });

  it("deleteData throws on HTTP error", async () => {
    server.use(
      http.delete(`${base}/atomic/v1/:slug`, () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(api.deleteData(jwt, "live", trustchain)).rejects.toThrow(
      "HTTP 500 Internal Server Error on DELETE",
    );
  });

  it("fetchStatus returns service info", async () => {
    await expect(api.fetchStatus()).resolves.toEqual({ name: "cloud-sync", version: "1.0.0" });
  });

  it("fetchStatus throws when HTTP response is not ok", async () => {
    server.use(http.get(`${base}/_info`, () => HttpResponse.json({}, { status: 500 })));
    await expect(api.fetchStatus()).rejects.toThrow("HTTP 500");
  });

  it("listenNotifications handles ping, jwt refresh, and version notifications", async () => {
    server.close();
    const { server: wsServer, port: wsPort, close: closeWsServer } = createWsServer();
    const wsApi = getApi(`http://localhost:${wsPort}`);
    const receiveTunnel = makeTunnel<string>();
    const clientTunnel = makeTunnel<WebSocket>();
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    wsServer.on("connection", ws => {
      clientTunnel.write(ws);
      ws.on("message", data => receiveTunnel.write(data.toString()));
    });

    try {
      const clientPromise = clientTunnel.read();
      const notificationsPromise = firstValueFrom(
        wsApi.listenNotifications(async () => jwt, "live").pipe(toArray()),
      );
      const client = await clientPromise;

      expect(await receiveTunnel.read()).toBe("mock-jwt");
      client.send("ping");
      expect(await receiveTunnel.read()).toBe("pong");
      client.send("JWT expired");
      expect(await receiveTunnel.read()).toBe("mock-jwt");
      client.send("42");
      client.send("unexpected-message");
      client.close();

      await expect(notificationsPromise).resolves.toEqual([42]);
      expect(warnSpy).toHaveBeenCalledWith("cloudsync: unexpected message", "unexpected-message");
    } finally {
      warnSpy.mockRestore();
      await closeWsServer();
      server.listen();
    }
  });

  it("listenNotifications propagates jwt refresh failures", async () => {
    server.close();
    const { server: wsServer, port: wsPort, close: closeWsServer } = createWsServer();
    const wsApi = getApi(`http://localhost:${wsPort}`);

    wsServer.on("connection", () => {});

    try {
      await expect(
        firstValueFrom(
          wsApi
            .listenNotifications(async () => {
              throw new Error("jwt failed");
            }, "live")
            .pipe(toArray()),
        ),
      ).rejects.toThrow("jwt failed");
    } finally {
      await closeWsServer();
      server.listen();
    }
  });
});

function createWsServer() {
  const server = new WebSocket.Server({ port: 0 });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind websocket server");
  }
  return {
    server,
    port: address.port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()));
      }),
  };
}

function makeTunnel<V>() {
  let resolve = (_v: V | Promise<V>) => {};
  let nextPromise = new Promise<V>(success => {
    resolve = success;
  });
  return {
    write: (v: V) => {
      resolve(v);
      nextPromise = new Promise<V>(success => {
        resolve = success;
      });
    },
    read: (): Promise<V> => nextPromise,
  };
}
