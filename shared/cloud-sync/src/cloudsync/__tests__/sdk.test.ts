import { z } from "zod";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import WebSocket from "ws";
import { CloudSyncSDK, UpdateEvent } from "../sdk";
import { WalletSyncOutdated } from "../../trustchain-types";
import type { MemberCredentials, Trustchain, TrustchainSDK } from "../../trustchain-types";

describe("CloudSyncSDK", () => {
  const port = 54036;
  const base = `http://localhost:${port}`;
  const schema = z.object({ value: z.string() });
  type Data = z.infer<typeof schema>;

  let storedData: string | null = null;
  let storedVersion = 0;
  let postCounter = 0;

  const trustchain: Trustchain = {
    rootId: "root-id",
    applicationPath: "0'/16'/0'",
    walletSyncEncryptionKey: "key",
  };
  const creds: MemberCredentials = { pubkey: "pub", privatekey: "priv" };

  const server = setupServer(
    http.get(`${base}/atomic/v1/:slug`, ({ request }) => {
      const version = parseInt(new URL(request.url).searchParams.get("version") || "0", 10);
      if (!storedData) return HttpResponse.json({ status: "no-data" });
      if (storedVersion <= version) return HttpResponse.json({ status: "up-to-date" });
      return HttpResponse.json({
        status: "out-of-sync",
        version: storedVersion,
        payload: storedData,
        date: new Date().toISOString(),
      });
    }),
    http.post(`${base}/atomic/v1/:slug`, async ({ request }) => {
      postCounter += 1;
      const version = parseInt(new URL(request.url).searchParams.get("version") || "0", 10);
      const { payload } = (await request.json()) as { payload: string };
      if (version !== storedVersion + 1) {
        const extra =
          postCounter % 3 === 0
            ? {}
            : postCounter % 3 === 1
              ? { info: "lld/0.0.0" }
              : { info: null };
        return HttpResponse.json({
          status: "out-of-sync",
          version: storedVersion,
          payload: storedData,
          date: new Date().toISOString(),
          ...extra,
        });
      }
      storedVersion = version;
      storedData = payload;
      return HttpResponse.json({ status: "updated" });
    }),
    http.delete(`${base}/atomic/v1/:slug`, () => {
      storedData = null;
      storedVersion = 0;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  let version = 0;
  let data: Data | null = null;
  let trustchainSdk: TrustchainSDK;
  let sdk: CloudSyncSDK<typeof schema>;

  beforeAll(() => server.listen());
  afterAll(() => server.close());

  beforeEach(() => {
    postCounter = 0;
    storedData = null;
    storedVersion = 0;
    version = 0;
    data = null;
    trustchainSdk = makeMockTrustchainSdk();
    sdk = new CloudSyncSDK({
      apiBaseUrl: base,
      slug: "test",
      schema,
      trustchainSdk,
      getCurrentVersion: () => version,
      saveNewUpdate: (update: UpdateEvent<Data>) => {
        switch (update.type) {
          case "new-data":
          case "pushed-data":
            version = update.version;
            data = update.data;
            break;
          case "deleted-data":
            version = 0;
            data = null;
            break;
        }
        return Promise.resolve();
      },
    });
  });

  it("pull/push/destroy keeps local and remote state in sync", async () => {
    await sdk.pull(trustchain, creds);
    expect(data).toBeNull();
    expect(version).toBe(0);

    await sdk.push(trustchain, creds, { value: "hello" });
    expect(data).toEqual({ value: "hello" });
    expect(version).toBe(1);

    await sdk.push(trustchain, creds, { value: "bar" });
    expect(data).toEqual({ value: "bar" });
    expect(version).toBe(2);

    await sdk.pull(trustchain, creds);
    expect(version).toBe(2);

    await sdk.destroy(trustchain, creds);
    expect(data).toBeNull();
    expect(version).toBe(0);
    expect(storedData).toBeNull();
  });

  it("rejects invalid payloads on push", async () => {
    await expect(sdk.push(trustchain, creds, { invalid: 42 } as unknown as Data)).rejects.toThrow();
  });

  it("throws WalletSyncOutdated when local version exists but remote has no data", async () => {
    version = 1;
    data = { value: "old" };
    await expect(sdk.pull(trustchain, creds)).rejects.toThrow(WalletSyncOutdated);
    expect(data).toBeNull();
    expect(version).toBe(0);
  });

  it("prevents concurrent push/pull/destroy calls", async () => {
    await expect(
      Promise.all([sdk.pull(trustchain, creds), sdk.pull(trustchain, creds)]),
    ).rejects.toThrow("CloudSyncSDK locked");
  });

  it("ignores push conflicts without updating local state", async () => {
    await sdk.push(trustchain, creds, { value: "hello" });
    version = 4;
    data = { value: "hello" };
    storedVersion = 5;

    await sdk.push(trustchain, creds, { value: "conflict" });
    expect(data).toEqual({ value: "hello" });
    expect(version).toBe(4);
  });

  it("pulls newer remote data when local version is behind", async () => {
    await sdk.push(trustchain, creds, { value: "remote" });
    version = 0;
    data = null;

    await sdk.pull(trustchain, creds);
    expect(data).toEqual({ value: "remote" });
    expect(version).toBe(1);
  });

  it("propagates decrypt failures on pull", async () => {
    await sdk.push(trustchain, creds, { value: "remote" });
    trustchainSdk.decryptUserData = () => Promise.reject(new Error("decryption failed"));
    version = 0;
    await expect(sdk.pull(trustchain, creds)).rejects.toThrow("decryption failed");
  });

  it("listenNotifications requests a refreshed jwt for the websocket handshake", async () => {
    const { server: wsServer, port: wsPort, close: closeWsServer } = createWsServer();
    const sdkWithWs = new CloudSyncSDK({
      apiBaseUrl: `http://localhost:${wsPort}`,
      slug: "test",
      schema,
      trustchainSdk,
      getCurrentVersion: () => version,
      saveNewUpdate: async () => {},
    });
    const receiveTunnel = makeTunnel<string>();

    wsServer.on("connection", ws => {
      ws.on("message", data => receiveTunnel.write(data.toString()));
    });

    try {
      const receivePromise = receiveTunnel.read();
      const sub = sdkWithWs.listenNotifications(trustchain, creds).subscribe();
      await expect(receivePromise).resolves.toBe("mock-live-jwt");
      expect(trustchainSdk.withAuth).toHaveBeenCalledWith(
        trustchain,
        creds,
        expect.any(Function),
        "refresh",
      );
      sub.unsubscribe();
    } finally {
      await closeWsServer();
    }
  });
});

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

function makeMockTrustchainSdk(): TrustchainSDK {
  return {
    withAuth: jest.fn(async (_trustchain, _creds, fn) => fn({ accessToken: "mock-live-jwt" })),
    encryptUserData: jest.fn(async (_trustchain, payload) => payload),
    decryptUserData: jest.fn(async (_trustchain, payload) => payload),
  };
}
