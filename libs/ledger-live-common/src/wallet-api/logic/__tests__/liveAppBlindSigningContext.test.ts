import { signMessageLogic } from "../signMessage";
import { signRawTransactionLogic } from "../signRawTransaction";
import { WalletAPIContext } from "../context";
import * as converters from "../../converters";
import * as signMessage from "../../../hw/signMessage/index";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { liveBlindSigningReporter } from "@ledgerhq/live-dmk-shared";
import { TrackingAPI } from "../../tracking";
import {
  createAppManifest,
  createFixtureAccount,
  createMessageData,
  createSignedOperation,
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

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const mockedGetAccountIdFromWalletAccountId = jest.mocked(
  converters.getAccountIdFromWalletAccountId,
);
const mockedPrepareMessageToSign = jest.mocked(signMessage.prepareMessageToSign);

describe("liveBlindSigningReporter live-app context wrapping", () => {
  const setContextSpy = jest.spyOn(liveBlindSigningReporter, "setContext");

  beforeEach(() => {
    setContextSpy.mockClear();
    liveBlindSigningReporter.setContext({ liveAppContext: null });
    setContextSpy.mockClear();
    mockedGetAccountIdFromWalletAccountId.mockReset();
  });

  afterAll(() => {
    setContextSpy.mockRestore();
  });

  it("signMessageLogic sets the manifest id while signing and clears it on success", async () => {
    const accountId = "js:2:ethereum:0x012:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const context: WalletAPIContext = {
      manifest: createAppManifest("velora"),
      accounts: [createFixtureAccount("12")],
      tracking: {
        signMessageRequested: jest.fn(),
        signMessageFail: jest.fn(),
      } as unknown as TrackingAPI,
    };
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    mockedPrepareMessageToSign.mockResolvedValueOnce(createMessageData());

    const uiNavigation = jest.fn().mockImplementation(async () => {
      expect(liveBlindSigningReporter.getContext().liveAppContext).toBe("velora");
      return Buffer.from("ok");
    });

    await signMessageLogic(context, walletAccountId, "msg", uiNavigation);

    expect(setContextSpy).toHaveBeenNthCalledWith(1, { liveAppContext: "velora" });
    expect(setContextSpy).toHaveBeenLastCalledWith({ liveAppContext: null });
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });

  it("signMessageLogic clears the live-app context even when uiNavigation throws", async () => {
    const accountId = "js:2:ethereum:0x012:";
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const context: WalletAPIContext = {
      manifest: createAppManifest("earn"),
      accounts: [createFixtureAccount("12")],
      tracking: {
        signMessageRequested: jest.fn(),
        signMessageFail: jest.fn(),
      } as unknown as TrackingAPI,
    };
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce(accountId);
    mockedPrepareMessageToSign.mockResolvedValueOnce(createMessageData());

    const uiNavigation = jest.fn().mockRejectedValueOnce(new Error("user rejected"));

    await expect(signMessageLogic(context, walletAccountId, "msg", uiNavigation)).rejects.toThrow(
      "user rejected",
    );

    expect(setContextSpy).toHaveBeenLastCalledWith({ liveAppContext: null });
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });

  it("signRawTransactionLogic sets the manifest id and clears it after sign", async () => {
    const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
    const context: WalletAPIContext = {
      manifest: createAppManifest("velora"),
      accounts: [createFixtureAccount("12")],
      tracking: {
        signRawTransactionRequested: jest.fn(),
        signRawTransactionFail: jest.fn(),
      } as unknown as TrackingAPI,
    };
    mockedGetAccountIdFromWalletAccountId.mockReturnValueOnce("js:2:ethereum:0x012:");

    const uiNavigation = jest.fn().mockImplementation(async () => {
      expect(liveBlindSigningReporter.getContext().liveAppContext).toBe("velora");
      return createSignedOperation();
    });

    await signRawTransactionLogic(context, walletAccountId, "0xrawtx", uiNavigation);

    expect(setContextSpy).toHaveBeenNthCalledWith(1, { liveAppContext: "velora" });
    expect(setContextSpy).toHaveBeenLastCalledWith({ liveAppContext: null });
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });

  it("does not leak the live-app context when an early validation throws", async () => {
    const context: WalletAPIContext = {
      manifest: createAppManifest("velora"),
      accounts: [],
      tracking: {
        signRawTransactionRequested: jest.fn(),
        signRawTransactionFail: jest.fn(),
      } as unknown as TrackingAPI,
    };

    await expect(signRawTransactionLogic(context, "wallet-id", "", jest.fn())).rejects.toThrow(
      "Transaction required",
    );

    expect(setContextSpy).toHaveBeenLastCalledWith({ liveAppContext: null });
    expect(liveBlindSigningReporter.getContext().liveAppContext).toBeNull();
  });
});
