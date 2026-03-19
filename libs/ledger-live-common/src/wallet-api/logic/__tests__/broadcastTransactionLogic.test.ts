import { broadcastTransactionLogic } from "../broadcastTransaction";
import * as converters from "../../converters";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import {
  createContextContainingAccountId,
  createSignedOperation,
} from "./testHelpers";

jest.mock("../../converters", () => ({
  ...jest.requireActual("../../converters"),
  getAccountIdFromWalletAccountId: jest.fn(),
  accountToWalletAPIAccount: jest.fn(),
}));

setupMockCryptoAssetsStore();

const mockedGetAccountIdFromWalletAccountId = jest.mocked(
  converters.getAccountIdFromWalletAccountId,
);

describe("broadcastTransactionLogic", () => {
  const mockWalletAPIBroadcastFail = jest.fn();

  const context = createContextContainingAccountId({
    tracking: {
      broadcastFail: mockWalletAPIBroadcastFail,
    },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });

  const uiNavigation = jest.fn();

  beforeEach(() => {
    mockWalletAPIBroadcastFail.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  describe("when nominal case", () => {
    const accountId = "js:2:ethereum:0x012:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const signedTransaction = createSignedOperation();

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    });

    it("calls uiNavigation callback with a signedOperation", async () => {
      const expectedResult = "Function called";
      uiNavigation.mockResolvedValueOnce(expectedResult);

      const result = await broadcastTransactionLogic(
        context,
        walletAccountId,
        signedTransaction,
        uiNavigation,
      );

      expect(uiNavigation).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      await broadcastTransactionLogic(context, walletAccountId, signedTransaction, uiNavigation);

      expect(mockWalletAPIBroadcastFail).toHaveBeenCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    const nonFoundAccountId = "js:2:ethereum:0x010:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const signedTransaction = createSignedOperation();

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(nonFoundAccountId);
    });

    it("returns an error", async () => {
      const expectedResult = "Function called";
      uiNavigation.mockResolvedValueOnce(expectedResult);

      await expect(async () => {
        await broadcastTransactionLogic(context, walletAccountId, signedTransaction, uiNavigation);
      }).rejects.toThrow("Account required");

      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      await expect(async () => {
        await broadcastTransactionLogic(context, walletAccountId, signedTransaction, uiNavigation);
      }).rejects.toThrow();

      expect(mockWalletAPIBroadcastFail).toHaveBeenCalledTimes(1);
    });
  });
});
