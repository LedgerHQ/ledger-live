import type { AssetInfo, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createFrameworkSigner } from "../signer/frameworkSigner";
import {
  createMockCantonSigner,
  createMockCoinConfigValue,
  createMockContext,
  createMockPrepareTransferResponse,
} from "../test/fixtures";
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

describe("createApi write path", () => {
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
});
