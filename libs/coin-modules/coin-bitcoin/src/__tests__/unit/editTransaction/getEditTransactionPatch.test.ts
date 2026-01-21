import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction as BtcTransaction } from "../../../types";

jest.mock("../../../buildRbfTransaction", () => ({
  buildRbfTx: jest.fn(),
}));

import { buildRbfTx } from "../../../buildRbfTransaction";
import { getEditTransactionPatch } from "../../../editTransaction/getEditTransactionPatch";

const mockedBuildRbfTx = buildRbfTx as unknown as jest.Mock;

describe("coin-bitcoin editTransaction/getEditTransactionPatch", () => {
  const account = {} as Account;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls buildRbfTx with replaceTxId and returns it when network fast fee is unavailable", () => {
    const originalTxId = "orig-txid";

    const baseIntent: Partial<BtcTransaction> = {
      family: "bitcoin",
      feePerByte: new BigNumber(10),
      feesStrategy: "custom",
      networkInfo: undefined,
    };

    mockedBuildRbfTx.mockResolvedValueOnce(baseIntent);

    const tx = { replaceTxId: originalTxId } as unknown as BtcTransaction;

    return getEditTransactionPatch({
      editType: "speedup",
      transaction: tx,
      account,
    }).then(patch => {
      expect(mockedBuildRbfTx).toHaveBeenCalledTimes(1);
      expect(mockedBuildRbfTx).toHaveBeenCalledWith(account, originalTxId);

      expect(patch).toEqual(baseIntent);
    });
  });

  it("bumps feePerByte to at least the network fast fee and sets feesStrategy=fast when equal", () => {
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

    mockedBuildRbfTx.mockResolvedValueOnce(baseIntent);

    const tx = { replaceTxId: originalTxId } as unknown as BtcTransaction;

    return getEditTransactionPatch({
      editType: "speedup",
      transaction: tx,
      account,
    }).then(patch => {
      expect(patch.feePerByte?.toNumber()).toBe(20);
      expect(patch.feesStrategy).toBe("fast");
    });
  });

  it("keeps feePerByte when already >= network fast fee", () => {
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

    mockedBuildRbfTx.mockResolvedValueOnce(baseIntent);

    const tx = { replaceTxId: originalTxId } as unknown as BtcTransaction;

    return getEditTransactionPatch({
      editType: "speedup",
      transaction: tx,
      account,
    }).then(patch => {
      expect(patch.feePerByte?.toNumber()).toBe(25);
      expect(patch.feesStrategy).toBe("custom");
    });
  });

  it("throws when replaceTxId is missing", () => {
    const tx = {} as unknown as BtcTransaction;

    return expect(
      getEditTransactionPatch({
        editType: "speedup",
        transaction: tx,
        account,
      }),
    ).rejects.toThrow("replaceTxId is required");
  });
});
