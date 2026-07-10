import { signTransactionLogic } from "../signTransaction";
import * as converters from "../../converters";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  createContextContainingAccountId,
  createWalletAPIEthereumTransaction,
  createSignedOperation,
} from "./testHelpers";

jest.mock("../../converters", () => ({
  ...jest.requireActual("../../converters"),
  getAccountIdFromWalletAccountId: jest.fn(),
  getWalletAPITransactionSignFlowInfos: jest.fn(),
}));

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

const mockedGetAccountId = jest.mocked(converters.getAccountIdFromWalletAccountId);
const mockedGetSignFlowInfos = jest.mocked(converters.getWalletAPITransactionSignFlowInfos);

const familyOf = (account: AccountLike): string =>
  account.type === "TokenAccount" ? account.token.parentCurrencyId : account.currency.family;

describe("signTransactionLogic", () => {
  const signTransactionRequested = jest.fn();
  const signTransactionFail = jest.fn();

  const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
  const transaction = createWalletAPIEthereumTransaction();

  const context = createContextContainingAccountId({
    tracking: { signTransactionRequested, signTransactionFail },
    accountsParams: [{ id: "11" }, { id: "12" }],
  });
  // createFixtureAccount turns "11" into an id like "js:2:ethereum:0x011:".
  const account = context.accounts[0];
  const knownAccountId = account.id;

  const uiNavigation = jest.fn();

  beforeEach(() => {
    signTransactionRequested.mockClear();
    signTransactionFail.mockClear();
    uiNavigation.mockClear();
    mockedGetAccountId.mockReset();
    mockedGetSignFlowInfos.mockReset();
  });

  describe("nominal case", () => {
    beforeEach(() => {
      mockedGetAccountId.mockReturnValue(knownAccountId);
      mockedGetSignFlowInfos.mockResolvedValue({
        canEditFees: true,
        hasFeesProvided: true,
        liveTx: { family: familyOf(account) },
      } as unknown as Awaited<ReturnType<typeof converters.getWalletAPITransactionSignFlowInfos>>);
    });

    it("resolves with the uiNavigation result and forwards the sign-flow infos", async () => {
      const signedOperation = createSignedOperation();
      uiNavigation.mockResolvedValueOnce(signedOperation);

      const result = await signTransactionLogic(
        context,
        walletAccountId,
        transaction,
        uiNavigation,
      );

      expect(result).toBe(signedOperation);
      expect(uiNavigation).toHaveBeenCalledTimes(1);
      expect(uiNavigation.mock.calls[0][2]).toEqual({
        canEditFees: true,
        hasFeesProvided: true,
        liveTx: { family: familyOf(account) },
      });
    });

    it("tracks the request and not a failure", async () => {
      uiNavigation.mockResolvedValueOnce(createSignedOperation());

      await signTransactionLogic(context, walletAccountId, transaction, uiNavigation);

      expect(signTransactionRequested).toHaveBeenCalledTimes(1);
      expect(signTransactionFail).not.toHaveBeenCalled();
    });

    it("forwards isEmbeddedSwap, partner and swapEntryPoint to the tracking call", async () => {
      uiNavigation.mockResolvedValueOnce(createSignedOperation());

      await signTransactionLogic(
        context,
        walletAccountId,
        transaction,
        uiNavigation,
        undefined,
        true,
        "partnerX",
        "entryX",
      );

      expect(signTransactionRequested).toHaveBeenCalledWith(
        context.manifest,
        true,
        "partnerX",
        "entryX",
      );
    });
  });

  describe("error cases", () => {
    it("throws when the transaction is missing and tracks failure", async () => {
      mockedGetAccountId.mockReturnValue(knownAccountId);

      await expect(
        signTransactionLogic(
          context,
          walletAccountId,
          undefined as unknown as ReturnType<typeof createWalletAPIEthereumTransaction>,
          uiNavigation,
        ),
      ).rejects.toThrow("Transaction required");

      expect(signTransactionFail).toHaveBeenCalledTimes(1);
      expect(uiNavigation).not.toHaveBeenCalled();
    });

    it("throws when the walletAccountId is unknown and tracks failure", async () => {
      mockedGetAccountId.mockReturnValue("");

      await expect(
        signTransactionLogic(context, walletAccountId, transaction, uiNavigation),
      ).rejects.toThrow(`accountId ${walletAccountId} unknown`);

      expect(signTransactionFail).toHaveBeenCalledTimes(1);
      expect(uiNavigation).not.toHaveBeenCalled();
    });

    it("throws when the account cannot be found and tracks failure", async () => {
      mockedGetAccountId.mockReturnValue("js:2:ethereum:0xUNKNOWN:");

      await expect(
        signTransactionLogic(context, walletAccountId, transaction, uiNavigation),
      ).rejects.toThrow("Account required");

      expect(signTransactionFail).toHaveBeenCalledTimes(1);
      expect(uiNavigation).not.toHaveBeenCalled();
    });

    it("throws when account and transaction families differ", async () => {
      mockedGetAccountId.mockReturnValue(knownAccountId);
      mockedGetSignFlowInfos.mockResolvedValue({
        canEditFees: false,
        hasFeesProvided: false,
        liveTx: { family: "some-other-family" },
      } as unknown as Awaited<ReturnType<typeof converters.getWalletAPITransactionSignFlowInfos>>);

      await expect(
        signTransactionLogic(context, walletAccountId, transaction, uiNavigation),
      ).rejects.toThrow("Account and transaction must be from the same family");

      expect(uiNavigation).not.toHaveBeenCalled();
    });
  });
});
