import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { z } from "zod";
import { Challenge, crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { mockKeyRingTreeRecord } from "@domain/entity-key-ring/schema.mock";
import { initMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { createKeyRingIdentityProvider } from "./identityProvider";
import type { KeyRingState } from "@domain/entity-key-ring";
import { selectKeyRingSession } from "../state/session";
import { keyRingRuntimeExtra } from "../state/runtime";
import { keyRingAttestationFixture, keyRingAuthChallengeFixture } from "../testing";

function makeJwt(payload: Record<string, unknown>): string {
  const prefix = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${prefix}.${body}.signature`;
}

const HOST = `https://${keyRingAuthChallengeFixture.json.host}`;
const IDP_TOKEN = makeJwt({ sub: "idp", exp: 4102444800 });
const KEYCLOAK_TOKEN = {
  access_token: makeJwt({ sub: "keycloak", exp: 4102444800 }),
  token_type: "Bearer",
};

const authenticate = jest.fn<Response, [{ request: Request }]>();
const server = setupServer(
  http.post(`${HOST}/openid/v1/authenticate`, authenticate),
  http.post(`${HOST}/openid/v1/token`, () =>
    HttpResponse.json({ access_token: IDP_TOKEN, token_type: "Bearer" }),
  ),
  http.post(`${HOST}/openid/v1/exchange`, () => HttpResponse.json(KEYCLOAK_TOKEN)),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  authenticate.mockReset();
});
afterAll(() => server.close());

const SignedChallengeSchema = z.object({
  signature: z.object({
    credential: z.object({ publicKey: z.string() }),
    signature: z.string(),
    attestation: z.string().optional(),
  }),
});

async function postedChallenge() {
  return SignedChallengeSchema.parse(await authenticate.mock.calls[0][0].request.json());
}

// The provider of an app store: the runtime and the session read the same state.
function providerOn(readState: () => KeyRingState) {
  const { keyRingRuntime } = keyRingRuntimeExtra({ getState: () => ({ trustchain: readState() }) });
  return createKeyRingIdentityProvider(keyRingRuntime, () =>
    selectKeyRingSession({ trustchain: readState() }),
  );
}

const REQUEST = {
  challenge: keyRingAuthChallengeFixture,
  clientId: "ledger-wallet",
  redirectUri: "https://ledger.test/callback",
};

describe("createKeyRingIdentityProvider", () => {
  it("signs the challenge with the member key and attests the key tree", async () => {
    authenticate.mockReturnValue(HttpResponse.json("auth-code"));
    const memberCredentials = initMemberCredentials();
    const tree = mockKeyRingTreeRecord({ rootId: "ROOTID" });
    const state = mockKeyRingState({ trustchain: tree, memberCredentials });
    const provider = providerOn(() => state);

    expect(provider.brokerId).toBe("lkrp");
    await provider.authenticate(REQUEST);

    const body = await postedChallenge();
    expect(body.signature.credential.publicKey).toBe(memberCredentials.pubkey);
    expect(body.signature.attestation).toBe(keyRingAttestationFixture("ROOTID"));
    const [challenge] = Challenge.fromBytes(crypto.from_hex(keyRingAuthChallengeFixture.tlv));
    const signed = crypto.hash(challenge.getUnsignedTLV());
    expect(
      crypto.verify(
        signed,
        crypto.from_hex(body.signature.signature),
        crypto.from_hex(memberCredentials.pubkey),
      ),
    ).toBe(true);
  });

  it("reads the state at each authentication", async () => {
    authenticate.mockReturnValue(HttpResponse.json("auth-code"));
    let state = mockKeyRingState({ trustchain: null, memberCredentials: null });
    const provider = providerOn(() => state);

    await expect(provider.authenticate(REQUEST)).rejects.toMatchObject({
      name: "WalletAuthNoCredentialsError",
    });
    expect(authenticate).not.toHaveBeenCalled();

    state = mockKeyRingState({ trustchain: null, memberCredentials: initMemberCredentials() });
    await provider.authenticate(REQUEST);
    const body = await postedChallenge();
    expect(body.signature.attestation).toBeUndefined();
  });

  it("signs with the member key of the runtime's key store", async () => {
    authenticate.mockReturnValue(HttpResponse.json("auth-code"));
    const storeKey = initMemberCredentials();
    const tree = mockKeyRingTreeRecord({ rootId: "ROOTID" });
    const { keyRingRuntime } = keyRingRuntimeExtra({
      getState: () => ({
        trustchain: mockKeyRingState({ trustchain: tree, memberCredentials: storeKey }),
      }),
    });
    const provider = createKeyRingIdentityProvider(keyRingRuntime, () =>
      selectKeyRingSession({
        trustchain: mockKeyRingState({ trustchain: tree, memberCredentials: null }),
      }),
    );

    await provider.authenticate(REQUEST);

    const body = await postedChallenge();
    expect(body.signature.credential.publicKey).toBe(storeKey.pubkey);
    expect(body.signature.attestation).toBe(keyRingAttestationFixture("ROOTID"));
  });

  it("refuses a runtime this package did not build", () => {
    expect(() =>
      createKeyRingIdentityProvider({ kind: "KeyRingRuntime" }, () =>
        selectKeyRingSession({ trustchain: mockKeyRingState() }),
      ),
    ).toThrow("Unknown key ring runtime");
  });
});
