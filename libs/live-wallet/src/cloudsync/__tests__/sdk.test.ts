import { z } from "zod";
import WebSocket from "ws";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { CloudSyncSDK, UpdateEvent } from "../sdk";
import { MockSDK } from "@ledgerhq/trustchain/mockSdk";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { TransportReplayer } from "@ledgerhq/hw-transport-mocker/lib/openTransportReplayer";
import { RecordStore } from "@ledgerhq/hw-transport-mocker";
import { MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { TrustchainOutdated } from "@ledgerhq/trustchain/errors";

describe("CloudSyncSDK basics", () => {
  const port = 54034;
  const base = "http://localhost:" + port;

  setEnv("CLOUD_SYNC_API_STAGING", base);

  let expectedBackendTrustchain: Trustchain;
  function verifyTrustchainParams(params: URLSearchParams) {
    if (params.get("id") !== expectedBackendTrustchain.rootId) {
      throw new Error("wrong params.id");
    }
    if (params.get("path") !== expectedBackendTrustchain.applicationPath) {
      throw new Error("wrong params.path");
    }
  }

  let storedData: string | null = null;
  let storedVersion = 0;

  let postCounter = 0;

  const handlers = [
    http.get(base + "/atomic/v1/:slug", ({ request }) => {
      if (request.headers.get("Authorization") !== "Bearer mock-live-jwt") {
        return HttpResponse.json({}, { status: 401 });
      }
      const params = new URL(request.url).searchParams;
      verifyTrustchainParams(params);
      const version = parseInt(params.get("version") || "0", 10);
      if (!storedData) {
        return HttpResponse.json({ status: "no-data" });
      } else if (storedVersion <= version) {
        return HttpResponse.json({ status: "up-to-date" });
      } else {
        return HttpResponse.json({
          status: "out-of-sync",
          version: storedVersion,
          payload: storedData,
          date: new Date().toISOString(),
        });
      }
    }),
    http.post(base + "/atomic/v1/:slug", async ({ request }) => {
      ++postCounter;
      if (request.headers.get("Authorization") !== "Bearer mock-live-jwt") {
        return HttpResponse.json({}, { status: 401 });
      }
      const params = new URL(request.url).searchParams;
      verifyTrustchainParams(params);
      const version = parseInt(params.get("version") || "0", 10);
      const json = await request.json();
      const { payload } = json as { payload: string };
      if (version !== storedVersion + 1) {
        // to cover different accepted payloads, we sometimes returns info or not
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
    http.delete(base + "/atomic/v1/:slug", ({ request }) => {
      const params = new URL(request.url).searchParams;
      verifyTrustchainParams(params);
      if (request.headers.get("Authorization") !== "Bearer mock-live-jwt") {
        return HttpResponse.json({}, { status: 401 });
      }
      storedData = null;
      storedVersion = 0;
      return new HttpResponse(null, {
        status: 204,
      });
    }),
  ];

  let mswServer: ReturnType<typeof setupServer>;
  beforeAll(() => {
    mswServer = setupServer(...handlers);
    mswServer.listen();
  });

  afterAll(() => {
    mswServer.close();
  });

  const schema = z.object({
    value: z.string(),
  });
  type Data = z.infer<typeof schema>;

  let trustchainSdk: MockSDK;
  let sdk: CloudSyncSDK<typeof schema>;
  let trustchain: Trustchain;
  let creds: MemberCredentials;

  let version = 0;
  let data: Data | null = null;

  it("init", async () => {
    trustchainSdk = new MockSDK({
      applicationId: 16,
      name: "user",
      apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
    });

    creds = await trustchainSdk.initMemberCredentials();

    const transport = new TransportReplayer(new RecordStore());

    const result = await trustchainSdk.getOrCreateTrustchain(transport, creds);
    trustchain = result.trustchain;
    expectedBackendTrustchain = trustchain;

    const getCurrentVersion = () => version;

    const saveNewUpdate = (up: UpdateEvent<Data>) => {
      switch (up.type) {
        case "new-data":
        case "pushed-data":
          version = up.version;
          data = up.data;
          break;
        case "deleted-data":
          version = 0;
          data = null;
          break;
      }
      return Promise.resolve();
    };

    sdk = new CloudSyncSDK({
      apiBaseUrl: getEnv("CLOUD_SYNC_API_STAGING"),
      slug: "test",
      schema: z.object({
        value: z.string(),
      }),
      trustchainSdk,
      getCurrentVersion,
      saveNewUpdate,
    });
  });

  it("one client pull/push/destroy", async () => {
    await sdk.pull(trustchain, creds);

    expect(data).toBe(null);
    expect(version).toBe(0);

    await sdk.push(trustchain, creds, { value: "hello" });

    expect(data).toEqual({ value: "hello" });
    expect(version).toBe(1);
    expect(storedData).not.toBe(null);
    expect(storedVersion).toBe(version);

    await sdk.push(trustchain, creds, { value: "bar" });

    expect(data).toEqual({ value: "bar" });
    expect(version).toBe(2);
    expect(storedVersion).toBe(version);

    await sdk.push(trustchain, creds, { value: "baz", extraignored: 42 } as Data);

    await expect(sdk.push(trustchain, creds, { invalid: 42 } as unknown as Data)).rejects.toThrow();

    expect(data).toEqual({ value: "baz", extraignored: 42 });
    expect(version).toBe(3);
    expect(storedVersion).toBe(version);

    await sdk.pull(trustchain, creds);
    expect(version).toBe(3);
    await sdk.pull(trustchain, creds);
    await sdk.pull(trustchain, creds);
    expect(version).toBe(3);

    await sdk.destroy(trustchain, creds);

    expect(data).toBe(null);
    expect(version).toBe(0);
    expect(storedData).toBe(null);
    expect(storedVersion).toBe(0);
  });

  it("should throw TrustchainOutdated when local data exists (has version) but there is no upstream data", async () => {
    try {
      data = { value: "old" };
      version = 1;
      await expect(sdk.pull(trustchain, creds)).rejects.toThrow(TrustchainOutdated);
      expect(data).toEqual(null);
      expect(version).toBe(0);
    } finally {
      data = null;
      version = 0;
    }
  });

  it("protects from race condition", async () => {
    const promises = [sdk.pull(trustchain, creds), sdk.pull(trustchain, creds)];
    await expect(Promise.all(promises)).rejects.toThrow();

    const promises2 = [
      sdk.pull(trustchain, creds),
      sdk.push(trustchain, creds, { value: "hello" }),
    ];
    await expect(Promise.all(promises2)).rejects.toThrow();

    const promises3 = [
      sdk.push(trustchain, creds, { value: "hello" }),
      sdk.push(trustchain, creds, { value: "hello" }),
    ];
    await expect(Promise.all(promises3)).rejects.toThrow();

    // before moving to next test, just wait everything
    await Promise.all(
      promises
        .concat(promises2)
        .concat(promises3)
        .map(p => p.catch(() => {})),
    );
  });

  it("two clients conflict", async () => {
    let version2 = 0;
    let data2: Data | null = null;

    const trustchainSdk = new MockSDK({
      applicationId: 16,
      name: "user",
      apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
    });

    const getCurrentVersion = () => version2;

    const saveNewUpdate = (up: UpdateEvent<Data>) => {
      switch (up.type) {
        case "new-data":
        case "pushed-data":
          version2 = up.version;
          data2 = up.data;
          break;
        case "deleted-data":
          version2 = 0;
          data2 = null;
          break;
      }
      return Promise.resolve();
    };

    const sdk2 = new CloudSyncSDK({
      apiBaseUrl: getEnv("CLOUD_SYNC_API_STAGING"),
      slug: "test",
      schema: z.object({
        value: z.string(),
      }),
      trustchainSdk,
      getCurrentVersion,
      saveNewUpdate,
    });

    await sdk.pull(trustchain, creds);
    await sdk2.pull(trustchain, creds);

    expect(data).toBe(null);
    expect(version).toBe(0);
    expect(data2).toBe(null);
    expect(version2).toBe(0);

    await sdk.push(trustchain, creds, { value: "hello" });
    expect(data).toEqual({ value: "hello" });
    expect(version).toBe(1);

    await sdk2.push(trustchain, creds, { value: "world" });
    expect(version2).toBe(0); // conflicts! remains at version=0 because we couldn't push & we will need to pull

    expect(data).toEqual({ value: "hello" });
    expect(version).toBe(1);

    await sdk2.pull(trustchain, creds);
    expect(data2).toEqual({ value: "hello" });
    expect(version2).toBe(1);

    await sdk2.push(trustchain, creds, { value: "world" });
    expect(data2).toEqual({ value: "world" });
    expect(version2).toBe(2);

    // intentionally making sdk out of sync for the next test
  });

  it("handles decryptUserData failure", async () => {
    trustchainSdk.decryptUserData = () => Promise.reject(new Error("test mock decryption failed"));
    await expect(sdk.pull(trustchain, creds)).rejects.toThrow("test mock decryption failed");
    await sdk.destroy(trustchain, creds);
  });

  it("listenNotifications", async () => {
    mswServer.close();

    const wsServer = new WebSocket.Server({ port });
    try {
      const receiveMessageTunnel = makeTunnel<string>();
      const notificationTunel = makeTunnel<number>();
      const clientTunnel = makeTunnel<WebSocket>();
      const completeTunnel = makeTunnel<boolean>();
      const clientPromise = clientTunnel.read();

      wsServer.on("connection", ws => {
        clientTunnel.write(ws);
        ws.on("message", e => {
          receiveMessageTunnel.write(e.toString());
        });
      });

      const sub = sdk.listenNotifications(trustchain, creds).subscribe(
        notification => {
          notificationTunel.write(notification);
        },
        () => {
          completeTunnel.write(false);
        },
        () => {
          completeTunnel.write(true);
        },
      );

      const client = await clientPromise;

      expect(await receiveMessageTunnel.read()).toBe("mock-live-jwt");

      client.send(Buffer.from("ping", "utf-8"));

      expect(await receiveMessageTunnel.read()).toBe("pong");

      client.send(Buffer.from("JWT expired", "utf-8"));

      expect(await receiveMessageTunnel.read()).toBe("mock-live-jwt");

      client.send(Buffer.from("42", "utf-8"));

      expect(await notificationTunel.read()).toBe(42);

      client.send(Buffer.from("43", "utf-8"));

      expect(await notificationTunel.read()).toBe(43);

      client.close();

      expect(await completeTunnel.read()).toBe(true);

      sub.unsubscribe();
    } finally {
      wsServer.close();
    }
  });
});

// a simple read/write tunnel, one value at a time
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
