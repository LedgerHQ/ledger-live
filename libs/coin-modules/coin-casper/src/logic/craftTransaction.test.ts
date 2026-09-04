import { InvalidAddress } from "@ledgerhq/ledger-wallet-framework/errors";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { Args, NativeTransferBuilder, Transaction } from "casper-js-sdk";
import { TEST_ADDRESSES, TEST_TRANSFER_IDS } from "../__tests__/fixtures/addresses.fixture";
import { CASPER_FEES_MOTES, CASPER_MAX_TRANSFER_ID } from "../constants";
import { CasperInvalidTransferId } from "../errors";
import type { CasperMemo } from "../types";
import { craftTransaction } from "./craftTransaction";

const baseIntent = (
  overrides: Partial<TransactionIntent<CasperMemo>> = {},
): TransactionIntent<CasperMemo> => {
  return {
    intentType: "transaction",
    type: "send",
    sender: TEST_ADDRESSES.SECP256K1,
    recipient: TEST_ADDRESSES.RECIPIENT_SECP256K1,
    amount: 2_500_000_000n,
    asset: { type: "native" },
    ...overrides,
  };
};

const getArgs = (crafted: string): Args => {
  return Transaction.fromJSON(crafted).getTransactionV1()!.payload.fields.args;
};

describe("craftTransaction", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("crafts a native transfer whose output round-trips through Transaction.fromJSON", async () => {
    const { transaction } = await craftTransaction(baseIntent());

    expect(() => Transaction.fromJSON(transaction)).not.toThrow();
  });

  it("includes the transfer id and preserves its exact value", async () => {
    const idSpy = jest.spyOn(NativeTransferBuilder.prototype, "id");

    const { transaction } = await craftTransaction(
      baseIntent({
        memo: {
          type: "string",
          kind: "transferId",
          value: TEST_TRANSFER_IDS.VALID,
        },
      }),
    );

    expect(idSpy).toHaveBeenCalledTimes(1);
    expect(idSpy).toHaveBeenCalledWith(TEST_TRANSFER_IDS.VALID);
    const idArg = getArgs(transaction).getByName("id");
    expect(idArg?.option?.isEmpty()).toBe(false);
    expect(idArg?.option?.value()?.ui64?.toString()).toBe(TEST_TRANSFER_IDS.VALID);
  });

  it("includes the transfer id from the generic-adapter memo shape (type=transferId)", async () => {
    const idSpy = jest.spyOn(NativeTransferBuilder.prototype, "id");

    const { transaction } = await craftTransaction({
      ...baseIntent(),
      memo: { type: "transferId", value: TEST_TRANSFER_IDS.VALID },
    } as TransactionIntent<CasperMemo>);

    expect(idSpy).toHaveBeenCalledTimes(1);
    expect(idSpy).toHaveBeenCalledWith(TEST_TRANSFER_IDS.VALID);
    const idArg = getArgs(transaction).getByName("id");
    expect(idArg?.option?.isEmpty()).toBe(false);
    expect(idArg?.option?.value()?.ui64?.toString()).toBe(TEST_TRANSFER_IDS.VALID);
  });

  it.each([
    ["no memo is provided", undefined],
    ["the transfer id is an empty string", ""],
  ])("omits the id argument entirely when %s", async (_case, value) => {
    const idSpy = jest.spyOn(NativeTransferBuilder.prototype, "id");

    const { transaction } = await craftTransaction(
      baseIntent(
        value === undefined ? {} : { memo: { type: "string", kind: "transferId", value } },
      ),
    );

    expect(idSpy).not.toHaveBeenCalled();
    expect(getArgs(transaction).getByName("id")).toBeUndefined();
  });

  it.each([
    ["beyond Number.MAX_SAFE_INTEGER", "9007199254740993"],
    ["just below the maximum", new BigNumber(CASPER_MAX_TRANSFER_ID).minus(1).toString()],
  ])("preserves a transfer id %s without truncation", async (_case, value) => {
    const { transaction } = await craftTransaction(
      baseIntent({ memo: { type: "string", kind: "transferId", value } }),
    );

    expect(getArgs(transaction).getByName("id")?.option?.value()?.ui64?.toString()).toBe(value);
  });

  it("rejects a transfer id equal to the maximum (validateMemo is strictly less-than)", async () => {
    await expect(
      craftTransaction(
        baseIntent({
          memo: {
            type: "string",
            kind: "transferId",
            value: CASPER_MAX_TRANSFER_ID,
          },
        }),
      ),
    ).rejects.toThrow(CasperInvalidTransferId);
  });

  it("rejects a non-numeric transfer id", async () => {
    await expect(
      craftTransaction(
        baseIntent({
          memo: {
            type: "string",
            kind: "transferId",
            value: TEST_TRANSFER_IDS.INVALID,
          },
        }),
      ),
    ).rejects.toThrow(CasperInvalidTransferId);
  });

  it.each(["sender", "recipient"] as const)("rejects an invalid %s", async field => {
    await expect(craftTransaction(baseIntent({ [field]: TEST_ADDRESSES.INVALID }))).rejects.toThrow(
      InvalidAddress,
    );
  });

  it("rejects a non-native asset", async () => {
    await expect(
      craftTransaction(baseIntent({ asset: { type: "cep18", assetReference: "hash-123" } })),
    ).rejects.toThrow(/cep18/);
  });

  it("rejects a staking intent", async () => {
    await expect(craftTransaction({ ...baseIntent(), intentType: "staking" })).rejects.toThrow(
      /staking/,
    );
  });

  it("uses customFees.value to override the default payment amount", async () => {
    const paymentSpy = jest.spyOn(NativeTransferBuilder.prototype, "payment");

    await craftTransaction(baseIntent(), { value: 999_000_000n });

    expect(paymentSpy).toHaveBeenCalledTimes(1);
    expect(paymentSpy).toHaveBeenCalledWith(999_000_000);
  });

  it("defaults the payment amount from getEstimatedFees when customFees is omitted", async () => {
    const paymentSpy = jest.spyOn(NativeTransferBuilder.prototype, "payment");

    await craftTransaction(baseIntent());

    expect(paymentSpy).toHaveBeenCalledTimes(1);
    expect(paymentSpy).toHaveBeenCalledWith(CASPER_FEES_MOTES);
  });
});
