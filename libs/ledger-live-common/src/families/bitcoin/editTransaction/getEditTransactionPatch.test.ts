import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "../types";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "./buildRbfTransaction";
import { getEditTransactionPatch } from "./getEditTransactionPatch";

jest.mock("./buildRbfTransaction", () => ({
  buildRbfSpeedUpTx: jest.fn(),
  buildRbfCancelTx: jest.fn(),
}));

const mockedBuildRbfSpeedUpTx = buildRbfSpeedUpTx as jest.Mock;
const mockedBuildRbfCancelTx = buildRbfCancelTx as jest.Mock;

const ORIGINAL_TXID = "orig-txid";

const makeTransaction = (
  familySpecificData?: BtcTransaction["familySpecificData"],
): BtcTransaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(50_000),
    recipient: "external-1",
    ...(familySpecificData ? { familySpecificData } : {}),
  }) as BtcTransaction;

const replacement = (feesStrategy: BtcTransaction["feesStrategy"]): BtcTransaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(50_000),
    recipient: "external-1",
    feesStrategy,
    familySpecificData: { replaceTxId: ORIGINAL_TXID, rbf: true },
  }) as BtcTransaction;

describe("editTransaction/getEditTransactionPatch", () => {
  const account = {} as Account;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds a speed up of the transaction familySpecificData.replaceTxId points to", async () => {
    const speedUp = replacement("fast");
    mockedBuildRbfSpeedUpTx.mockResolvedValueOnce(speedUp);

    const patch = await getEditTransactionPatch({
      editType: "speedup",
      transaction: makeTransaction({ replaceTxId: ORIGINAL_TXID, rbf: true }),
      account,
    });

    expect(mockedBuildRbfSpeedUpTx).toHaveBeenCalledTimes(1);
    expect(mockedBuildRbfSpeedUpTx).toHaveBeenCalledWith(account, ORIGINAL_TXID);
    expect(mockedBuildRbfCancelTx).not.toHaveBeenCalled();
    expect(patch).toBe(speedUp);
  });

  it("builds a cancel of the transaction familySpecificData.replaceTxId points to", async () => {
    const cancel = replacement("custom");
    mockedBuildRbfCancelTx.mockResolvedValueOnce(cancel);

    const patch = await getEditTransactionPatch({
      editType: "cancel",
      transaction: makeTransaction({ replaceTxId: ORIGINAL_TXID }),
      account,
    });

    expect(mockedBuildRbfCancelTx).toHaveBeenCalledTimes(1);
    expect(mockedBuildRbfCancelTx).toHaveBeenCalledWith(account, ORIGINAL_TXID);
    expect(mockedBuildRbfSpeedUpTx).not.toHaveBeenCalled();
    expect(patch).toBe(cancel);
  });

  it.each([
    ["there is no familySpecificData", makeTransaction()],
    ["familySpecificData has no replaceTxId", makeTransaction({ rbf: true })],
    ["replaceTxId is empty", makeTransaction({ replaceTxId: "" })],
    [
      "replaceTxId is only set at the top level (legacy shape)",
      { ...makeTransaction(), replaceTxId: ORIGINAL_TXID } as unknown as BtcTransaction,
    ],
  ])("throws when %s", (_, transaction) => {
    expect(() =>
      getEditTransactionPatch({
        editType: "speedup",
        transaction,
        account,
      }),
    ).toThrow("replaceTxId is required");
    expect(mockedBuildRbfSpeedUpTx).not.toHaveBeenCalled();
    expect(mockedBuildRbfCancelTx).not.toHaveBeenCalled();
  });
});
