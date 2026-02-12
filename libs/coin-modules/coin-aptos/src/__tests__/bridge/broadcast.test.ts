import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import broadcast from "../../bridge/broadcast";
import { AptosAPI } from "../../network";

jest.mock("../../network");
jest.mock("@ledgerhq/coin-framework/operation");

describe("broadcast", () => {
  const mockAccount: Account = {
    type: "Account",
    seedIdentifier: "mockSeedIdentifier",
    operationsCount: 0,
    id: "mockAccountId",
    currency: {
      type: "CryptoCurrency",
      id: "aptos",
      name: "Aptos",
      ticker: "APT",
      units: [{ name: "APT", code: "APT", magnitude: 6 }],
      managerAppName: "Aptos",
      coinType: 637,
      scheme: "aptos",
      color: "#000000",
      family: "aptos",
      blockAvgTime: 5,
      explorerViews: [],
    },
    balance: BigNumber(1000),
    spendableBalance: BigNumber(1000),
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    blockHeight: 0,
    index: 0,
    derivationMode: "",
    freshAddress: "",
    freshAddressPath: "",
    used: false,
    swapHistory: [],
    creationDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: 0, balances: [] },
      DAY: { latestDate: 0, balances: [] },
      WEEK: { latestDate: 0, balances: [] },
    },
  };

  const mockOperation: Operation = {
    id: "mockOperationId",
    hash: "",
    type: "OUT",
    value: BigNumber(100),
    fee: BigNumber(1),
    senders: ["sender"],
    recipients: ["recipient"],
    blockHeight: null,
    blockHash: null,
    accountId: "mockAccountId",
    date: new Date(),
    extra: {},
  };

  const mockSignedOperation: SignedOperation = {
    operation: mockOperation,
    signature: "mockSignature",
  };

  it("should broadcast the signed operation and return the patched operation", async () => {
    const mockHash = "mockHash";
    (AptosAPI.prototype.broadcast as jest.Mock).mockResolvedValue(mockHash);
    (patchOperationWithHash as jest.Mock).mockReturnValue({
      ...mockOperation,
      hash: mockHash,
    });

    const result = await broadcast({
      signedOperation: mockSignedOperation,
      account: mockAccount,
    });

    expect(AptosAPI.prototype.broadcast).toHaveBeenCalledWith("mockSignature");
    expect(patchOperationWithHash).toHaveBeenCalledWith(mockOperation, mockHash);
    expect(result).toEqual({ ...mockOperation, hash: mockHash });
  });

  it("should throw an error if broadcast fails", async () => {
    (AptosAPI.prototype.broadcast as jest.Mock).mockRejectedValue(new Error("Broadcast failed"));

    await expect(
      broadcast({
        signedOperation: mockSignedOperation,
        account: mockAccount,
      }),
    ).rejects.toThrow("Broadcast failed");
  });
});
