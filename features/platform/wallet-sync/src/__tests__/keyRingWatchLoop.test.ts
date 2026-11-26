import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { z } from "zod";
import { makeCipher, type TrustchainSDK } from "@shared/cloud-sync";
import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import type { KeyRingStream } from "@features/platform-key-ring";
import { createKeyRingCloudSync } from "../cloudSync/keyRingCloudSync";
import { makeLocalIncrementalUpdate, makeSaveNewUpdate } from "../watchLoop/incrementalUpdates";
import { createRotationReencryption } from "../cloudSync/rotationReencryption";
import { createKeyRingWatchLoop } from "../internals/keyRingWatchLoop";

const API = "https://cloud-sync.test";
const URL = `${API}/atomic/v1/live`;
const schema = z.object({ value: z.string() });
type Doc = z.infer<typeof schema>;
type Local = { value: string };
type State = { local: Local; distant: { data: Doc | null; version: number } };

// Encryption is the key ring's job: an identity cipher keeps the payload readable here.
const identity: TrustchainSDK = {
  withAuth: (_t, _c, job) => job({ accessToken: "unused" }),
  encryptUserData: async (_t, data) => data,
  decryptUserData: async (_t, data) => data,
};
const LOCATOR = { rootId: "unused", applicationPath: "unused", walletSyncEncryptionKey: "" };
const cipher = makeCipher<Doc>(identity);

function fakeStream(ref = { treeId: "root-id", streamPath: "m/0'/16'/0'" }) {
  const stream: KeyRingStream = {
    ref,
    withAuth: jest.fn(async job => job({ accessToken: `token-${ref.streamPath}` })),
    encrypt: jest.fn(async data => data),
    decrypt: jest.fn(async data => data),
  };
  return stream;
}

const walletsync: CloudSyncDataManager<Local, string, typeof schema> = {
  schema,
  diffLocalToDistant: (local, latest) => ({
    hasChanges: local.value !== latest?.value,
    nextState: { value: local.value },
  }),
  resolveIncrementalUpdate: async (local, latest, incoming) =>
    incoming && incoming.value !== latest?.value && incoming.value !== local.value
      ? { hasChanges: true, update: incoming.value }
      : { hasChanges: false },
  applyUpdate: (_local, update) => ({ value: update }),
};

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function setup(initial: State) {
  let state = initial;
  const getState = () => state;
  const dispatched: unknown[] = [];
  const saveUpdate = jest.fn(async (data: Doc | null, version: number, local: Local | null) => {
    dispatched.push({ data, version, local });
    state = { local: local ?? state.local, distant: { data, version } };
  });
  const cloudSync = createKeyRingCloudSync<Doc>({
    apiBaseUrl: API,
    slug: "live",
    getCurrentVersion: () => getState().distant.version,
    saveNewUpdate: makeSaveNewUpdate({
      walletsync,
      getState,
      latestDistantStateSelector: s => s.distant.data,
      latestDistantVersionSelector: s => s.distant.version,
      localStateSelector: s => s.local,
      saveUpdate,
    }),
  });
  const onRefreshNeeded = jest.fn(async () => undefined);
  const onError = jest.fn();
  const stream = fakeStream();
  const cycleDone = new Promise<void>(resolve => {
    const handle = createKeyRingWatchLoop({
      walletsync,
      cloudSync,
      stream,
      watchConfig: { initialTimeout: 1 },
      getState,
      localStateSelector: s => s.local,
      latestDistantStateSelector: s => s.distant.data,
      localIncrementUpdate: makeLocalIncrementalUpdate({
        walletsync,
        getState,
        latestWalletStateSelector: s => s.distant,
        localStateSelector: s => s.local,
        saveUpdate,
      }),
      onRefreshNeeded,
      onError,
      setVisualPending: pending => {
        if (pending) return;
        handle.unsubscribe();
        resolve();
      },
    });
  });
  return { cycleDone, getState, dispatched, onRefreshNeeded, onError, stream };
}

describe("createKeyRingWatchLoop", () => {
  it("pulls a remote update on the key ring stream and stores it", async () => {
    const payload = await cipher.encrypt(LOCATOR, { value: "remote" });
    const requests: Request[] = [];
    server.use(
      http.get(URL, ({ request }) => {
        requests.push(request);
        return HttpResponse.json({ status: "out-of-sync", version: 2, payload, date: "now" });
      }),
    );
    const { cycleDone, getState, dispatched, stream } = setup({
      local: { value: "local" },
      distant: { data: { value: "local" }, version: 1 },
    });

    await cycleDone;

    const url = new globalThis.URL(requests[0].url);
    expect(url.searchParams.get("id")).toBe("root-id");
    expect(url.searchParams.get("path")).toBe("m/0'/16'/0'");
    expect(requests[0].headers.get("Authorization")).toBe("Bearer token-m/0'/16'/0'");
    expect(stream.decrypt).toHaveBeenCalled();
    expect(dispatched[0]).toEqual({
      data: { value: "remote" },
      version: 2,
      local: { value: "remote" },
    });
    expect(getState().local).toEqual({ value: "remote" });
  });

  it("pushes a local change encrypted on the key ring stream", async () => {
    const posted: { version: string | null; payload: string }[] = [];
    server.use(
      http.get(URL, () => HttpResponse.json({ status: "up-to-date" })),
      http.post(URL, async ({ request }) => {
        const body = z.object({ payload: z.string() }).parse(await request.json());
        posted.push({
          version: new globalThis.URL(request.url).searchParams.get("version"),
          payload: body.payload,
        });
        return HttpResponse.json({ status: "updated" });
      }),
    );
    const { cycleDone, dispatched, stream } = setup({
      local: { value: "edited" },
      distant: { data: { value: "old" }, version: 1 },
    });

    await cycleDone;

    expect(posted).toHaveLength(1);
    expect(posted[0].version).toBe("2");
    expect(await cipher.decrypt(LOCATOR, posted[0].payload)).toEqual({ value: "edited" });
    expect(stream.encrypt).toHaveBeenCalled();
    expect(dispatched).toEqual([{ data: { value: "edited" }, version: 2, local: null }]);
  });

  it("asks for a refresh when the data is gone under a known version", async () => {
    server.use(http.get(URL, () => HttpResponse.json({ status: "no-data" })));
    const { cycleDone, onRefreshNeeded, onError } = setup({
      local: { value: "local" },
      distant: { data: { value: "local" }, version: 3 },
    });

    await cycleDone;

    expect(onRefreshNeeded).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports any other error", async () => {
    server.use(http.get(URL, () => HttpResponse.json({ message: "down" }, { status: 503 })));
    const { cycleDone, onRefreshNeeded, onError } = setup({
      local: { value: "local" },
      distant: { data: null, version: 0 },
    });

    await cycleDone;

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ name: "CloudSyncHttpError" }));
    expect(onRefreshNeeded).not.toHaveBeenCalled();
  });
});

describe("createRotationReencryption", () => {
  it("deletes the data under the old stream, then uploads the current state under the new one", async () => {
    const calls: string[] = [];
    let uploaded = "";
    server.use(
      http.delete(URL, ({ request }) => {
        calls.push(
          `delete ${new globalThis.URL(request.url).searchParams.get("path")} ${request.headers.get("Authorization")}`,
        );
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(URL, async ({ request }) => {
        calls.push(
          `upload ${new globalThis.URL(request.url).searchParams.get("path")} ${request.headers.get("Authorization")}`,
        );
        uploaded = z.object({ payload: z.string() }).parse(await request.json()).payload;
        return HttpResponse.json({ status: "updated" });
      }),
    );
    const previous = fakeStream({ treeId: "root-id", streamPath: "old" });
    const next = fakeStream({ treeId: "root-id", streamPath: "new" });
    const handler = createRotationReencryption({
      cloudSyncApiBaseUrl: API,
      getCurrentWSState: () => ({ data: { value: "current" }, version: 4 }),
    });

    const afterRotation = await handler(previous);
    expect(previous.withAuth).toHaveBeenCalledWith(expect.any(Function), "refresh");
    await afterRotation(next);

    expect(calls).toEqual(["delete old Bearer token-old", "upload new Bearer token-new"]);
    expect(next.encrypt).toHaveBeenCalled();
    expect(await cipher.decrypt(LOCATOR, uploaded)).toEqual({ value: "current" });
  });
});
