import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import {
  createMockAccount,
  createMockTransaction,
  createMockSignedOperation,
} from "../__tests__/fixtures";
import { broadcast as logicBroadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { broadcast } from "./broadcast";

jest.mock("../logic/combine", () => ({
  combine: jest.fn().mockReturnValue("mockedCombinedTx"),
}));

jest.mock("../logic/broadcast", () => ({
  broadcast: jest.fn().mockResolvedValue("mockedTxHash"),
}));

const mockLogicBroadcast = jest.mocked(logicBroadcast);

describe("broadcast", () => {
  const mockAccount = createMockAccount();
  const mockTransaction = createMockTransaction();
  const mockSignedOperation = createMockSignedOperation(mockAccount, mockTransaction, {
    signature: "deadbeef",
    rawTxJson: { hash: "mockTxHash" },
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("delegates to combine and broadcasts the combined transaction", async () => {
    const result = await broadcast({
      account: mockAccount,
      signedOperation: mockSignedOperation,
    });

    expect(combine).toHaveBeenCalledTimes(1);
    expect(combine).toHaveBeenCalledWith(
      mockSignedOperation.rawData.tx,
      [mockSignedOperation.signature],
      mockAccount.freshAddress,
    );

    expect(logicBroadcast).toHaveBeenCalledTimes(1);
    expect(logicBroadcast).toHaveBeenCalledWith(expect.anything(), "mockedCombinedTx");

    expect(result.hash).toBe("mockedTxHash");
    expect(result).toEqual({
      ...patchOperationWithHash(mockSignedOperation.operation, "mockedTxHash"),
      hash: "mockedTxHash",
    });
  });

  test("should throw if rawData is missing", async () => {
    const invalidSignedOperation = {
      ...mockSignedOperation,
      rawData: null as any,
    };

    await expect(
      broadcast({
        account: mockAccount,
        signedOperation: invalidSignedOperation,
      }),
    ).rejects.toThrow("casper: rawData is required");

    expect(combine).not.toHaveBeenCalled();
  });

  test("should throw if rawData.tx is not a string", async () => {
    const invalidSignedOperation = {
      ...mockSignedOperation,
      rawData: { tx: { not: "a string" } } as any,
    };

    await expect(
      broadcast({
        account: mockAccount,
        signedOperation: invalidSignedOperation,
      }),
    ).rejects.toThrow("casper: rawData.tx is required");

    expect(combine).not.toHaveBeenCalled();
  });

  test("should throw if broadcast fails to return a hash", async () => {
    // @ts-expect-error - null on purpose to test the error case
    mockLogicBroadcast.mockResolvedValueOnce(null);

    await expect(
      broadcast({
        account: mockAccount,
        signedOperation: mockSignedOperation,
      }),
    ).rejects.toThrow("casper: failed to broadcast transaction and get transaction hash");
  });
});
