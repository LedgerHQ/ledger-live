import { signMessageLogic } from "../signMessage";
import * as converters from "../../converters";
import * as signMessage from "../../../hw/signMessage/index";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import {
  createContextContainingAccountId,
  createMessageData,
  createTokenAccount,
} from "./testHelpers";

jest.mock("../../converters", () => ({
  ...jest.requireActual("../../converters"),
  getAccountIdFromWalletAccountId: jest.fn(),
  accountToWalletAPIAccount: jest.fn(),
}));

jest.mock("../../../hw/signMessage/index", () => ({
  ...jest.requireActual("../../../hw/signMessage/index"),
  prepareMessageToSign: jest.fn(),
}));

setupMockCryptoAssetsStore();

const mockedGetAccountIdFromWalletAccountId = jest.mocked(
  converters.getAccountIdFromWalletAccountId,
);
const mockedPrepareMessageToSign = jest.mocked(signMessage.prepareMessageToSign);

describe("signMessageLogic", () => {
  const mockWalletAPISignMessageRequested = jest.fn();
  const mockWalletAPISignMessageFail = jest.fn();

  const context = createContextContainingAccountId({
    tracking: {
      signMessageRequested: mockWalletAPISignMessageRequested,
      signMessageFail: mockWalletAPISignMessageFail,
    },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });

  const uiNavigation = jest.fn();

  beforeEach(() => {
    mockWalletAPISignMessageRequested.mockClear();
    mockWalletAPISignMessageFail.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockClear();
  });

  describe("when nominal case", () => {
    const accountId = "js:2:ethereum:0x012:";
    const messageToSign = "Message to sign";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedPrepareMessageToSign.mockClear();
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    });

    it("calls uiNavigation callback with a signedOperation", async () => {
      const expectedResult = "Function called";
      const formattedMessage = createMessageData();
      mockedPrepareMessageToSign.mockReturnValueOnce(formattedMessage);
      uiNavigation.mockResolvedValueOnce(expectedResult);

      const result = await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);

      expect(uiNavigation).toHaveBeenCalledTimes(1);
      expect(uiNavigation.mock.calls[0][1]).toEqual(formattedMessage);
      expect(result).toEqual(expectedResult);
    });

    it("calls the tracking for success", async () => {
      await signMessageLogic(context, accountId, messageToSign, uiNavigation);

      expect(mockWalletAPISignMessageRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toHaveBeenCalledTimes(0);
    });
  });

  describe("when account cannot be found", () => {
    const nonFoundAccountId = "js:2:ethereum:0x010:";
    const messageToSign = "Message to sign";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(nonFoundAccountId);
    });

    it("returns an error", async () => {
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow("account not found");

      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow();

      expect(mockWalletAPISignMessageRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toHaveBeenCalledTimes(1);
    });
  });

  describe("when account found is not of type 'Account'", () => {
    const tokenAccountId = "15";
    const messageToSign = "Message to sign";
    context.accounts = [createTokenAccount(tokenAccountId), ...context.accounts];
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(tokenAccountId);
    });

    it("returns an error", async () => {
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow("account provided should be the main one");

      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow();

      expect(mockWalletAPISignMessageRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toHaveBeenCalledTimes(1);
    });
  });

  describe("when inner call prepareMessageToSign raise an error", () => {
    const accountId = "js:2:ethereum:0x012:";
    const messageToSign = "Message to sign";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

    beforeEach(() => {
      mockedPrepareMessageToSign.mockClear();
      mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    });

    it("returns an error", async () => {
      mockedPrepareMessageToSign.mockImplementationOnce(() => {
        throw new Error("Some error");
      });

      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow("Some error");

      expect(uiNavigation).toHaveBeenCalledTimes(0);
    });

    it("calls the tracking for error", async () => {
      mockedPrepareMessageToSign.mockImplementationOnce(() => {
        throw new Error("Some error");
      });

      await expect(async () => {
        await signMessageLogic(context, walletAccountId, messageToSign, uiNavigation);
      }).rejects.toThrow();

      expect(mockWalletAPISignMessageRequested).toHaveBeenCalledTimes(1);
      expect(mockWalletAPISignMessageFail).toHaveBeenCalledTimes(1);
    });
  });
});
