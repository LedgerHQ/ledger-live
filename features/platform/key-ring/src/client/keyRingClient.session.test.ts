import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { z } from "zod";
import { StreamTree, crypto, device, type Device } from "@ledgerhq/hw-ledger-key-ring-protocol";
import type { ApduDevice } from "@ledgerhq/hw-ledger-key-ring-protocol/ApduDevice";
import keyRingReducer, { selectKeyRingSecrets } from "@domain/entity-key-ring";
import { configureStore } from "@reduxjs/toolkit";
import { createKeyRingClient } from "./keyRingClient";
import { createKeyRingV1DeviceBridge } from "../v1";
import { selectKeyRingSession } from "../state/session";
import { commitKeyRingTree, importPersistedKeyRingState } from "../state/actions";
import { generateV1MemberKey } from "../internals/v1/sliceKeyStore";
import { keyRingAuthChallengeFixture } from "../testing";

const APP_URL = "https://trustchain.app.test";
const OTHER_URL = "https://trustchain.other.test";
const APPLICATION_PATH = "m/0'/16'/0'";
const ROOT_ID = "seed-trustchain";

type SeedDevice = Device & Pick<ApduDevice, "getSeedId">;

function encodeJwtPart(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function makeJwt(): string {
  return `${encodeJwtPart({ alg: "none", typ: "JWT" })}.${encodeJwtPart({ exp: 4102444800 })}.signature`;
}

const AuthenticateBodySchema = z.object({
  signature: z.object({ credential: z.object({ publicKey: z.string() }) }),
});

/** A key ring backend that knows the seed's key tree and authenticates its members only. */
function fakeKeyRingBackend(baseUrl: string, seed: Device, initialStreams: Record<string, string>) {
  let streams = { ...initialStreams };
  const requests: string[] = [];

  async function isMember(pubkey: string) {
    const application = StreamTree.deserialize(streams).getChild(APPLICATION_PATH);
    if (!application) return false;
    const members = (await application.resolve()).getMembers();
    return members.some(member => crypto.to_hex(member) === pubkey);
  }

  const handlers = [
    http.get(`${baseUrl}/v1/challenge`, ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json(keyRingAuthChallengeFixture);
    }),
    http.post(`${baseUrl}/v1/authenticate`, async ({ request }) => {
      requests.push(request.url);
      const { publicKey } = AuthenticateBodySchema.parse(await request.json()).signature.credential;
      const seedKey = crypto.to_hex((await seed.getPublicKey()).publicKey);
      if (publicKey !== seedKey && !(await isMember(publicKey))) {
        return HttpResponse.json({ message: "Not a member of trustchain" }, { status: 401 });
      }
      return HttpResponse.json({ access_token: makeJwt() });
    }),
    http.get(`${baseUrl}/v1/refresh`, ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json({ access_token: makeJwt() });
    }),
    http.get(`${baseUrl}/v1/trustchains`, ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json({ [ROOT_ID]: { "m/": ["owner"] } });
    }),
    http.get(`${baseUrl}/v1/trustchain/:id`, ({ request }) => {
      requests.push(request.url);
      return HttpResponse.json(streams);
    }),
    http.post(`${baseUrl}/v1/trustchain/:id/derivation`, async ({ request }) => {
      requests.push(request.url);
      const derivation = z.string().parse(await request.json());
      streams = StreamTree.deserialize({ ...streams, derivation }).serialize();
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return { handlers, requests };
}

async function seedTrustchain(seed: Device): Promise<Record<string, string>> {
  const tree = await StreamTree.createNewTree(seed);
  await tree.getRoot().resolve();
  return tree.serialize();
}

/** The seed's device: a software device in place of the Ledger Sync app. */
function seedDevice(): SeedDevice {
  const seed = device.software();
  return Object.assign(seed, {
    getSeedId: async () => {
      const publicKey = crypto.to_hex((await seed.getPublicKey()).publicKey);
      return {
        pubkeyCredential: {
          toJSON: () => ({ version: 0, curveId: 33, signAlgorithm: 1, publicKey }),
        },
        signature: new Uint8Array([1]),
        attestationResult: new Uint8Array([1]),
      };
    },
  }) as unknown as SeedDevice;
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("a key ring client derived for a device session", () => {
  let apdu: jest.SpiedFunction<typeof device.apdu>;

  beforeEach(() => {
    apdu = jest.spyOn(device, "apdu");
  });

  afterEach(() => {
    apdu.mockRestore();
  });

  it("joins the seed's key tree on the parent's backend through the session transport", async () => {
    const seed = seedDevice();
    const streams = await seedTrustchain(seed);
    const app = fakeKeyRingBackend(APP_URL, seed, streams);
    const other = fakeKeyRingBackend(OTHER_URL, seed, streams);
    server.use(...app.handlers, ...other.handlers);
    const sessionTransport = { session: "session-1" } as never;
    const createSessionTransport = jest.fn(() => sessionTransport);
    const transports: unknown[] = [];
    apdu.mockImplementation(transport => {
      transports.push(transport);
      return seed as unknown as ApduDevice;
    });
    const store = configureStore({ reducer: { trustchain: keyRingReducer } });
    store.dispatch(
      importPersistedKeyRingState({ trustchain: null, memberCredentials: generateV1MemberKey() }),
    );
    const appClient = createKeyRingClient({
      mock: false,
      instanceName: "Test instance",
      apiBaseUrl: APP_URL,
      deviceBridge: createKeyRingV1DeviceBridge({
        withDevice: () => () => {
          throw new Error("the app device access must not be used");
        },
        createSessionTransport,
      }),
    });
    const deviceSession = { dmk: {} as never, sessionId: "session-1" };
    const sessionClient = appClient.forDeviceSession(deviceSession);

    const activation = await sessionClient.activate(selectKeyRingSession(store.getState()), {});
    store.dispatch(commitKeyRingTree(activation.tree));
    const restored = await appClient.restore(selectKeyRingSession(store.getState()));
    store.dispatch(commitKeyRingTree(restored));

    expect(activation.outcome).toBe("joined");
    expect(transports).not.toHaveLength(0);
    expect(transports.every(transport => transport === sessionTransport)).toBe(true);
    expect(createSessionTransport).toHaveBeenCalledWith(deviceSession);
    expect(app.requests.filter(url => url.endsWith("/derivation"))).toHaveLength(1);
    expect(other.requests).toEqual([]);
    expect(selectKeyRingSecrets(store.getState()).trustchain).toMatchObject({
      rootId: ROOT_ID,
      applicationPath: APPLICATION_PATH,
    });
  });
});
