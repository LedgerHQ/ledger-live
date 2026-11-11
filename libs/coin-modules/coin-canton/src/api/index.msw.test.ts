import type { AssetInfo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createFrameworkSigner } from "../signer/frameworkSigner";
import {
  createMockCantonSigner,
  createMockCoinConfigValue,
  createMockContext,
  createMockInstrumentBalances,
  createMockOnboardingPrepareResponse,
  createMockPrepareTransferResponse,
} from "../test/fixtures";
import { TooManyUtxosWarning, TopologyChangeError } from "../types/errors";
import type { CantonMemo } from "../types/transaction";
import { createApi } from ".";

const PATH = "44'/6767'/0'/0'/0'";
const SENDER = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const RECIPIENT = "bob::122014d3f17b82700d15bef451bcb1d112136eb82bb3f4fd2a4649f95a9c4632b000";
const MAGNITUDE = 10n ** 38n;

const config = createMockCoinConfigValue();
const context = createMockContext(config);
const prepared = createMockPrepareTransferResponse({ hash: "prepare-hash" });
const partyUrl = `${config.gatewayUrl}/v1/node/:node/party/:party`;

type Received = { party: unknown; body: unknown };
const prepares: Received[] = [];
const submits: Received[] = [];

const server = setupServer(
  http.post(`${partyUrl}/transaction/prepare`, async ({ params, request }) => {
    prepares.push({ party: params.party, body: await request.json() });
    return HttpResponse.json(prepared);
  }),
  http.post(`${partyUrl}/transaction/submit`, async ({ params, request }) => {
    submits.push({ party: params.party, body: await request.json() });
    return HttpResponse.json({ submission_id: "submission-id", update_id: "update-id" });
  }),
);

const transfer = (asset: AssetInfo) =>
  ({
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 100n,
    asset,
  }) as TransactionIntent<CantonMemo>;

const unknownRequest = () => HttpResponse.json({ message: "unexpected request" }, { status: 400 });

// Each case uses its own party, so the gateway's party and topology caches cannot leak between them.
// The gateway answers only for that party and its key, so a request for anyone else fails the case.
function gatewayFor(party: string, topologyChangeRequired: boolean) {
  const publicKey = `${party}-key`;
  server.use(
    http.get(`${partyUrl}/balance`, ({ params }) =>
      params.party === party
        ? HttpResponse.json(createMockInstrumentBalances(1, { utxo_count: 11 }))
        : unknownRequest(),
    ),
    http.get(partyUrl, ({ params }) =>
      params.party === party
        ? HttpResponse.json({ party_id: party, public_key: publicKey })
        : unknownRequest(),
    ),
    http.post(`${config.gatewayUrl}/v1/node/:node/onboarding/prepare`, async ({ request }) => {
      const { public_key } = (await request.json()) as { public_key: string };
      if (public_key !== publicKey) return unknownRequest();
      return topologyChangeRequired
        ? HttpResponse.json(createMockOnboardingPrepareResponse())
        : HttpResponse.json({ message: "party already exists" }, { status: 409 });
    }),
  );
}

describe("createApi against the gateway", () => {
  const api = createApi();
  const signer = createFrameworkSigner(createMockCantonSigner());

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    prepares.length = 0;
    submits.length = 0;
  });
  afterAll(() => server.close());

  it("should fail the broadcast when the gateway returns no update id", async () => {
    server.use(
      http.post(`${partyUrl}/transaction/submit`, () =>
        HttpResponse.json({ submission_id: "submission-id" }),
      ),
    );

    await expect(send({ type: "native" })).rejects.toThrow(
      "canton: broadcast returned no transaction id",
    );
  });

  async function send(asset: AssetInfo) {
    const { transaction } = await api.craftTransaction(context, transfer(asset));
    const signature = await signer.signTransaction(PATH, transaction);
    const signed = await api.combine(context, transaction, [signature]);
    const updateId = await api.broadcast(context, signed);
    return { signature, updateId };
  }

  it.each([
    ["native", { type: "native" }, { instrument_id: config.nativeInstrumentId }],
    [
      "token",
      { type: "token", assetReference: "USDCx", assetOwner: "issuer::1220" },
      { instrument_id: "USDCx", instrument_admin: "issuer::1220" },
    ],
  ])("should craft, sign, combine and broadcast a %s transfer", async (_, asset, instrument) => {
    const { signature, updateId } = await send(asset);

    expect(prepares).toEqual([
      {
        party: SENDER,
        body: {
          type: "token-transfer-request",
          recipient: RECIPIENT,
          amount: "100",
          execute_before_secs: 24 * 60 * 60,
          ...instrument,
        },
      },
    ]);
    expect(submits).toEqual([
      { party: SENDER, body: { serialized: prepared.serialized, signature } },
    ]);
    expect(updateId).toBe("update-id");
  });

  it.each([
    ["native", { type: "native" }],
    ["token", { type: "token", assetReference: "USDCx", assetOwner: "issuer::1220" }],
  ])("should estimate a %s transfer at 1 CC plus the tiered rate", async (_, asset) => {
    await expect(api.estimateFees(context, transfer(asset))).resolves.toEqual({
      value: MAGNITUDE + 1n,
    });
  });

  it("should estimate the configured fee when the config forces one", async () => {
    await expect(
      api.estimateFees(createMockContext({ ...config, fee: 2 }), transfer({ type: "native" })),
    ).resolves.toEqual({ value: 2n * MAGNITUDE });
  });

  describe("validateIntent", () => {
    const balances = [{ asset: { type: "native" as const }, value: 1000n, locked: 0n }];

    it("should read the utxo count from the gateway and pass the custom fee through", async () => {
      const sender = "carol::1220";
      gatewayFor(sender, false);

      await expect(
        api.validateIntent(context, { ...transfer({ type: "native" }), sender }, balances, {
          customFees: { value: 7n },
        }),
      ).resolves.toEqual({
        errors: {},
        warnings: { tooManyUtxos: expect.any(TooManyUtxosWarning) },
        estimatedFees: 7n,
        amount: 100n,
        totalSpent: 107n,
      });
    });

    it("should report a topology change the gateway requires for the party's key", async () => {
      const sender = "dave::1220";
      gatewayFor(sender, true);

      const { errors } = await api.validateIntent(
        context,
        { ...transfer({ type: "native" }), sender },
        balances,
        { customFees: { value: 0n } },
      );

      expect(errors.topologyChange).toBeInstanceOf(TopologyChangeError);
    });

    it("should keep checking the topology with the party's cached key when the lookup later fails", async () => {
      const sender = "erin::1220";
      gatewayFor(sender, true);
      const validate = () =>
        api.validateIntent(context, { ...transfer({ type: "native" }), sender }, balances, {
          customFees: { value: 0n },
        });
      await validate();
      server.use(
        http.get(partyUrl, () => HttpResponse.json({ message: "unavailable" }, { status: 400 })),
      );

      const { errors } = await validate();

      expect(errors.topologyChange).toBeInstanceOf(TopologyChangeError);
    });
  });
});
