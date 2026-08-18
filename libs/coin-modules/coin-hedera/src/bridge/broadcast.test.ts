import { patchOperationWithHash } from "@ledgerhq/ledger-wallet-framework/operation";
import { broadcast as logicBroadcast } from "../logic/broadcast";
import * as logicUtils from "../logic/utils";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import { broadcast } from "./broadcast";

jest.mock("../logic/broadcast");
jest.mock("@ledgerhq/ledger-wallet-framework/operation", () => ({
  patchOperationWithHash: jest.fn((op: unknown) => op),
}));
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  base64ToUrlSafeBase64: jest.fn((v: string) => `urlsafe-${v}`),
  isValidExtra: jest.fn(() => true),
  formatTransactionId: jest.fn(() => "formatted-tx-id"),
}));
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  patchOperationWithExtra: jest.fn((op: unknown, extra: unknown) => ({ ...(op as object), extra })),
}));

const mockTransactionResponse = {
  transactionHash: new Uint8Array([1, 2, 3]),
  transactionId: { toString: () => "0.0.1234@1234.5678" },
} as unknown as Awaited<ReturnType<typeof logicBroadcast>>;

describe("broadcast", () => {
  const mockAccount = getMockedAccount();
  const mockOperation = getMockedOperation({ extra: { consensusTimestamp: "1.2.3" } });
  const mockSignedOperation = {
    signature: "base64-signature",
    operation: mockOperation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(logicBroadcast).mockResolvedValue(mockTransactionResponse);
  });

  it("calls logicBroadcast with account currencyId and the signature", async () => {
    await broadcast({ signedOperation: mockSignedOperation as never, account: mockAccount });

    expect(logicBroadcast).toHaveBeenCalledTimes(1);
    expect(logicBroadcast).toHaveBeenCalledWith({
      configOrCurrencyId: mockAccount.currency.id,
      txWithSignature: mockSignedOperation.signature,
    });
  });

  it("patches the operation with a base64url-encoded hash from the response", async () => {
    await broadcast({ signedOperation: mockSignedOperation as never, account: mockAccount });

    expect(patchOperationWithHash).toHaveBeenCalledTimes(1);
    expect(patchOperationWithHash).toHaveBeenCalledWith(
      mockOperation,
      expect.stringContaining("urlsafe-"),
    );
  });

  it("includes the formatted transactionId in the operation extra", async () => {
    const result = await broadcast({
      signedOperation: mockSignedOperation as never,
      account: mockAccount,
    });

    expect(result).toMatchObject({
      extra: expect.objectContaining({ transactionId: "formatted-tx-id" }),
    });
  });

  it("merges existing valid extra with the new transactionId", async () => {
    const result = await broadcast({
      signedOperation: mockSignedOperation as never,
      account: mockAccount,
    });

    expect(result).toMatchObject({
      extra: expect.objectContaining({
        transactionId: "formatted-tx-id",
        consensusTimestamp: "1.2.3",
      }),
    });
  });

  it("does not spread operation.extra when isValidExtra returns false", async () => {
    jest.mocked(logicUtils.isValidExtra).mockReturnValueOnce(false);

    const result = await broadcast({
      signedOperation: mockSignedOperation as never,
      account: mockAccount,
    });

    expect(result).toMatchObject({
      extra: { transactionId: "formatted-tx-id" },
    });
    expect((result.extra as Record<string, unknown>).consensusTimestamp).toBeUndefined();
  });
});
