import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import { prepareTransferRequest } from "../../network/gateway";
import {
  createMockCoinConfigValue,
  createMockContext,
  createMockPrepareTransferResponse,
} from "../../test/fixtures";
import type { CantonMemo } from "../../types/transaction";
import { craftTransaction } from "../craftTransaction";

jest.mock("../../network/gateway", () => ({
  prepareTransferRequest: jest.fn(),
}));

const mockedPrepare = jest.mocked(prepareTransferRequest);

const SENDER = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const RECIPIENT = "bob::122014d3f17b82700d15bef451bcb1d112136eb82bb3f4fd2a4649f95a9c4632b000";
const config = createMockCoinConfigValue();
const context = createMockContext(config);

const intent = (overrides: Record<string, unknown> = {}) =>
  ({
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 100n,
    asset: { type: "native" },
    ...overrides,
  }) as TransactionIntent<CantonMemo>;

const preparedRequest = () => mockedPrepare.mock.calls[0][2];

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrepare.mockResolvedValue(createMockPrepareTransferResponse({ hash: "prepare-hash" }));
  });

  it("should prepare a native transfer under the sender party", async () => {
    await craftTransaction(context, intent());

    expect(mockedPrepare).toHaveBeenCalledWith(config, SENDER, {
      type: "token-transfer-request",
      recipient: RECIPIENT,
      amount: "100",
      execute_before_secs: 24 * 60 * 60,
      instrument_id: config.nativeInstrumentId,
    });
  });

  it("should wrap the prepared transaction with its party and expose the hash", async () => {
    const prepared = createMockPrepareTransferResponse({ hash: "prepare-hash" });

    const crafted = await craftTransaction(context, intent());

    expect(JSON.parse(crafted.transaction)).toEqual({
      party: SENDER,
      serialized: prepared.serialized,
      json: prepared.json,
    });
    expect(crafted.details).toEqual({ hash: "prepare-hash" });
  });

  it("should prepare a token transfer with its instrument id and admin", async () => {
    await craftTransaction(
      context,
      intent({ asset: { type: "token", assetReference: "USDCx", assetOwner: "issuer::1220" } }),
    );

    expect(preparedRequest()).toMatchObject({
      instrument_id: "USDCx",
      instrument_admin: "issuer::1220",
    });
  });

  it("should prepare a token transfer without an admin when the asset has no owner", async () => {
    await craftTransaction(context, intent({ asset: { type: "token", assetReference: "USDCx" } }));

    expect(preparedRequest().instrument_id).toBe("USDCx");
    expect(preparedRequest()).not.toHaveProperty("instrument_admin");
  });

  it("should treat a token typed by its token standard as a token", async () => {
    await craftTransaction(
      context,
      intent({ asset: { type: "cip56", assetReference: "USDCx", assetOwner: "issuer::1220" } }),
    );

    expect(preparedRequest().instrument_id).toBe("USDCx");
  });

  it("should accept the generic adapter's Payment intent type", async () => {
    await craftTransaction(context, intent({ type: "Payment" }));

    expect(mockedPrepare).toHaveBeenCalledTimes(1);
  });

  it("should prepare with the intent's expiration", async () => {
    await craftTransaction(context, intent({ expiration: 3600 }));

    expect(preparedRequest().execute_before_secs).toBe(3600);
  });

  it("should send a reason memo as the transfer reason", async () => {
    await craftTransaction(
      context,
      intent({ memo: { type: "string", kind: "reason", value: "invoice 42" } }),
    );

    expect(preparedRequest().reason).toBe("invoice 42");
  });

  it.each([
    ["absent", {}],
    ["none", { memo: { type: "none" } }],
    ["an empty reason", { memo: { type: "string", kind: "reason", value: "" } }],
  ])("should send no reason when the memo is %s", async (_, overrides) => {
    await craftTransaction(context, intent(overrides));

    expect(preparedRequest()).not.toHaveProperty("reason");
  });

  it.each([
    ["a staking intent", { intentType: "staking" }],
    ["a non-transfer type", { type: "stake" }],
    ["a template asset", { asset: { type: "template", assetReference: "pkg:Module:Entity" } }],
    ["a token without an instrument id", { asset: { type: "token", assetOwner: "issuer::1220" } }],
    ["a memo of another kind", { memo: { type: "string", kind: "text", value: "hi" } }],
    ["no sender", { sender: "" }],
  ])("should reject %s before preparing", async (_, overrides) => {
    await expect(craftTransaction(context, intent(overrides))).rejects.toThrow(
      InvalidParameterError,
    );
    expect(mockedPrepare).not.toHaveBeenCalled();
  });
});
