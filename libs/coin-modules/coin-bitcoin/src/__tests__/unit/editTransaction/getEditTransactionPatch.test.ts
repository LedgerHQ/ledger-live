import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "../../../types";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "../../../buildRbfTransaction";
import { getEditTransactionPatch } from "../../../editTransaction/getEditTransactionPatch";

jest.mock("../../../buildRbfTransaction", () => ({
  buildRbfSpeedUpTx: jest.fn(),
  buildRbfCancelTx: jest.fn(),
}));

const mockedBuildRbfSpeedUpTx = buildRbfSpeedUpTx as jest.Mock;
const mockedBuildRbfCancelTx = buildRbfCancelTx as jest.Mock;

describe("coin-bitcoin editTransaction/getEditTransactionPatch", () => {
  const account = {} as Account;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls buildRbfSpeedUpTx with replaceTxId and returns it when network fast fee is unavailable", async () => {
    const originalTxId = "orig-txid";

    const baseIntent: Partial<BtcTransaction> = {
      family: "bitcoin",
      feePerByte: new BigNumber(10),
      feesStrategy: "custom",
      networkInfo: undefined,
    };

    mockedBuildRbfSpeedUpTx.mockResolvedValueOnce(baseIntent);

    const tx = { replaceTxId: originalTxId } as unknown as BtcTransaction;
    const patch = await getEditTransactionPatch({
      editType: "speedup",
      transaction: tx,
      account,
    });

    expect(mockedBuildRbfSpeedUpTx).toHaveBeenCalledTimes(1);
    expect(mockedBuildRbfSpeedUpTx).toHaveBeenCalledWith(account, originalTxId);
    expect(patch).toEqual(baseIntent);
  });

  it("bumps feePerByte to at least the network fast fee and sets feesStrategy=fast when equal", async () => {
    const originalTxId = "orig-txid";
    const fast = new BigNumber(20);

    const baseIntent: Partial<BtcTransaction> = {
      family: "bitcoin",
      feePerByte: new BigNumber(10),
      feesStrategy: "custom",
      networkInfo: {
        feeItems: {
          items: [{ speed: "fast", feePerByte: fast }],
        },
      } as any,
    };

    mockedBuildRbfSpeedUpTx.mockResolvedValueOnce(baseIntent);

    const tx = { replaceTxId: originalTxId } as unknown as BtcTransaction;
    const patch = await getEditTransactionPatch({
      editType: "speedup",
      transaction: tx,
      account,
    });

    expect(patch.feePerByte?.toNumber()).toBe(20);
    expect(patch.feesStrategy).toBe("fast");
  });

  it("keeps feePerByte when already >= network fast fee", async () => {
    const originalTxId = "orig-txid";
    const fast = new BigNumber(20);

    const baseIntent: Partial<BtcTransaction> = {
      family: "bitcoin",
      feePerByte: new BigNumber(25),
      feesStrategy: "custom",
      networkInfo: {
        feeItems: {
          items: [{ speed: "fast", feePerByte: fast }],
        },
      } as any,
    };

    mockedBuildRbfSpeedUpTx.mockResolvedValueOnce(baseIntent);

    const tx = { replaceTxId: originalTxId } as unknown as BtcTransaction;
    const patch = await getEditTransactionPatch({
      editType: "speedup",
      transaction: tx,
      account,
    });

    expect(patch.feePerByte?.toNumber()).toBe(25);
    expect(patch.feesStrategy).toBe("custom");
  });

  it("throws when replaceTxId is missing", async () => {
    const tx = {} as unknown as BtcTransaction;

    await expect(
      getEditTransactionPatch({
        editType: "speedup",
        transaction: tx,
        account,
      }),
    ).rejects.toThrow("replaceTxId is required");
  });

  it("calls buildRbfCancelTx with replaceTxId and returns it when network fast fee is unavailable", async () => {
    const originalTxId = "orig-txid";

    const baseIntent: Partial<BtcTransaction> = {
      family: "bitcoin",
      feePerByte: new BigNumber(10),
      feesStrategy: "custom",
      networkInfo: undefined,
    };

    mockedBuildRbfCancelTx.mockResolvedValueOnce(baseIntent);

    const tx = { replaceTxId: originalTxId } as unknown as BtcTransaction;
    const patch = await getEditTransactionPatch({
      editType: "cancel",
      transaction: tx,
      account,
    });

    expect(mockedBuildRbfCancelTx).toHaveBeenCalledTimes(1);
    expect(mockedBuildRbfCancelTx).toHaveBeenCalledWith(account, originalTxId);
    expect(patch).toEqual(baseIntent);
  });

  it("bumps cancel feePerByte to fast and sets feesStrategy=fast when equal", async () => {
    const originalTxId = "orig-txid";
    const fast = new BigNumber(20);

    const baseIntent: Partial<BtcTransaction> = {
      family: "bitcoin",
      feePerByte: new BigNumber(10),
      feesStrategy: "custom",
      networkInfo: {
        feeItems: {
          items: [{ speed: "fast", feePerByte: fast }],
        },
      } as any,
    };

    mockedBuildRbfCancelTx.mockResolvedValueOnce(baseIntent);

    const tx = { replaceTxId: originalTxId } as unknown as BtcTransaction;
    const patch = await getEditTransactionPatch({
      editType: "cancel",
      transaction: tx,
      account,
    });

    expect(patch.feePerByte?.toNumber()).toBe(20);
    expect(patch.feesStrategy).toBe("fast");
  });
});
