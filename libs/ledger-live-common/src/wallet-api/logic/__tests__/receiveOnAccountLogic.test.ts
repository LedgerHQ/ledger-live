import { receiveOnAccountLogic } from "../receiveOnAccount";
import * as converters from "../../converters";
import { initialState as walletState } from "@ledgerhq/live-wallet/store";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import {
  createContextContainingAccountId,
  createWalletAPIAccount,
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
const mockedAccountToWalletAPIAccount = jest.mocked(converters.accountToWalletAPIAccount);

describe("receiveOnAccountLogic", () => {
  const mockWalletAPIReceiveRequested = jest.fn();
  const mockWalletAPIReceiveFail = jest.fn();

  const context = createContextContainingAccountId({
    tracking: {
      receiveRequested: mockWalletAPIReceiveRequested,
      receiveFail: mockWalletAPIReceiveFail,
    },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });

  const uiNavigation = jest.fn();

  beforeEach(() => {
    mockWalletAPIReceiveRequested.mockClear();
    mockWalletAPIReceiveFail.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
    mockedAccountToWalletAPIAccount.mockClear();
    mockedAccountToWalletAPIAccount.mockImplementation((_walletState, _account, _parentAccount) => {
      return createWalletAPIAccount();
    });
  });

  describe("when nominal case", () => {
    const accountId = "js:2:ethereum:0x012:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const expectedResult = "Function called";

    beforeEach(() => {
      uiNavigation.mockResolvedValueOnce(expectedResult);
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    });

    it("calls uiNavigation callback with an accountAddress", async () => {
      const convertedAccount = {
        ...createWalletAPIAccount(),
        address: "Converted address",
      };
      mockedAccountToWalletAPIAccount.mockReturnValueOnce(convertedAccount);

      const result = await receiveOnAccountLogic(
        walletState,
        context,
        walletAccountId,
        uiNavigation,
      );

      expect(uiNavigation).toHaveBeenCalledTimes(1);
      expect(uiNavigation.mock.calls[0][2]).toEqual("Converted address");
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      await receiveOnAccountLogic(walletState, context, walletAccountId, uiNavigation);

      expect(mockWalletAPIReceiveRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPIReceiveFail).toHaveBeenCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(undefined);
    });

    it("returns an error", async () => {
      await expect(async () => {
        await receiveOnAccountLogic(walletState, context, walletAccountId, uiNavigation);
      }).rejects.toThrow(`accountId ${walletAccountId} unknown`);

      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      await expect(async () => {
        await receiveOnAccountLogic(walletState, context, walletAccountId, uiNavigation);
      }).rejects.toThrow();

      expect(mockWalletAPIReceiveRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPIReceiveFail).toHaveBeenCalledTimes(1);
    });
  });
});
