import { importState } from "@shared/feature-flags";
import { StreamTree, crypto, device, type Device } from "@ledgerhq/hw-ledger-key-ring-protocol";
import type { ApduDevice } from "@ledgerhq/hw-ledger-key-ring-protocol/ApduDevice";
import { CHALLENGE } from "@ledgerhq/ledger-key-ring-protocol/__mocks__/challenge";
import { setTrustchain, trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import {
  type MemberCredentials,
  TrustchainResultType,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { HttpResponse, http, server } from "tests/server";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { buildDeviceConnection } from "../deviceIntents/__tests__/ledgerSyncIntentTestKit";
import { useCreateSessionSdk } from "../deviceIntents/useCreateSessionSdk";
import { useTrustchainSdk } from "../hooks/useTrustchainSdk";
import { useOnTrustchainRefreshNeeded } from "../hooks/useOnTrustchainRefreshNeeded";

jest.mock("../hooks/useInstanceName", () => ({
  useInstanceName: () => "Desktop instance",
}));

const PROD_URL = getWalletSyncEnvironmentParams("PROD").trustchainApiBaseUrl;
const STAGING_URL = getWalletSyncEnvironmentParams("STAGING").trustchainApiBaseUrl;
const APPLICATION_PATH = "m/0'/16'/0'";
const ROOT_ID = "seed-trustchain";

type SeedDevice = Device & Pick<ApduDevice, "getSeedId">;

/** A Ledger Sync backend that knows the seed's trustchain and authenticates its members only. */
function fakeTrustchainBackend(
  baseUrl: string,
  seed: Device,
  initialStreams: Record<string, string>,
) {
  let streams = { ...initialStreams };
  const requests: string[] = [];

  async function isMember(pubkey: string) {
    const application = StreamTree.deserialize(streams).getChild(APPLICATION_PATH);
    if (!application) return false;
    const members = (await application.resolve()).getMembers();
    return members.some(member => crypto.to_hex(member) === pubkey);
  }

  function record(request: Request) {
    requests.push(request.url);
  }

  const handlers = [
    http.get(`${baseUrl}/v1/challenge`, ({ request }) => {
      record(request);
      return HttpResponse.json({ tlv: CHALLENGE.tlv, json: CHALLENGE.json });
    }),
    http.post(`${baseUrl}/v1/authenticate`, async ({ request }) => {
      record(request);
      const body = (await request.json()) as {
        signature: { credential: { publicKey: string } };
      };
      const { publicKey } = body.signature.credential;
      const seedKey = crypto.to_hex((await seed.getPublicKey()).publicKey);
      if (publicKey !== seedKey && !(await isMember(publicKey))) {
        return HttpResponse.json({ message: "Not a member of trustchain" }, { status: 401 });
      }
      return HttpResponse.json({ access_token: makeJwt() });
    }),
    http.get(`${baseUrl}/v1/refresh`, ({ request }) => {
      record(request);
      return HttpResponse.json({ access_token: makeJwt() });
    }),
    http.get(`${baseUrl}/v1/trustchains`, ({ request }) => {
      record(request);
      return HttpResponse.json({ [ROOT_ID]: { "m/": ["owner"] } });
    }),
    http.get(`${baseUrl}/v1/trustchain/:id`, ({ request }) => {
      record(request);
      return HttpResponse.json(streams);
    }),
    http.post(`${baseUrl}/v1/trustchain/:id/derivation`, async ({ request }) => {
      record(request);
      const derivation = (await request.json()) as string;
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

function memberCredentials(): MemberCredentials {
  const keypair = crypto.randomKeypair();
  return {
    pubkey: crypto.to_hex(keypair.publicKey),
    privatekey: crypto.to_hex(keypair.privateKey),
  };
}

function encodeJwtPart(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function makeJwt(): string {
  return `${encodeJwtPart({ alg: "none", typ: "JWT" })}.${encodeJwtPart({ exp: 4102444800 })}.signature`;
}

describe("session SDK setup", () => {
  let apdu: jest.SpiedFunction<typeof device.apdu>;

  beforeEach(() => {
    apdu = jest.spyOn(device, "apdu");
  });

  afterEach(() => {
    apdu.mockRestore();
  });

  it("should add the member on the backend of the app SDK when the flag environment arrives late", async () => {
    const seed = seedDevice();
    const streams = await seedTrustchain(seed);
    const prod = fakeTrustchainBackend(PROD_URL, seed, streams);
    const staging = fakeTrustchainBackend(STAGING_URL, seed, streams);
    server.use(...prod.handlers, ...staging.handlers);
    const transports: unknown[] = [];
    apdu.mockImplementation(transport => {
      transports.push(transport);
      return seed as unknown as ApduDevice;
    });
    const credentials = memberCredentials();

    // The app SDK is built on the first render, before the remote flags arrive.
    const { result, store } = renderHook(
      () => ({
        // The wallet sync loop calls it when the app SDK reports the member as ejected.
        onTrustchainRefreshNeeded: useOnTrustchainRefreshNeeded(useTrustchainSdk(), credentials),
        createSessionSdk: useCreateSessionSdk(),
      }),
      { initialState: withFlagOverrides({ lldWalletSync: { enabled: true } }) },
    );
    act(() => {
      const featureFlags = store.getState().featureFlags;
      const walletSync = featureFlags.resolved.lldWalletSync;
      const params = { environment: "STAGING" as const, watchConfig: {}, learnMoreLink: "" };
      store.dispatch(
        importState({
          ...featureFlags,
          resolved: { ...featureFlags.resolved, lldWalletSync: { ...walletSync, params } },
        }),
      );
    });

    const sessionSdk = result.current.createSessionSdk(buildDeviceConnection("session-1"));
    const added = await sessionSdk.getOrCreateTrustchain("any-device-id", credentials);
    act(() => {
      store.dispatch(setTrustchain(added.trustchain));
    });
    await act(() => result.current.onTrustchainRefreshNeeded(added.trustchain));

    expect(added.type).toBe(TrustchainResultType.updated);
    expect(transports).not.toHaveLength(0);
    expect(transports.every(transport => transport instanceof DmkCompatTransport)).toBe(true);
    expect(prod.requests.filter(url => url.endsWith("/derivation"))).toHaveLength(1);
    expect(staging.requests).toEqual([]);
    expect(trustchainSelector(store.getState())).toEqual(added.trustchain);
  });
});
