import type { Account, SignedOperation } from "@ledgerhq/types-live";
import { createTransactionSignHandler } from "../transactionSign";
import * as signTransaction from "../../logic/signTransaction";
import { makeHandlerDeps, getDepsFrom, createTrackingSpies } from "./testHelpers";
import {
  createFixtureAccount,
  createSignedOperation,
  createWalletAPIEthereumTransaction,
} from "../../logic/__tests__/testHelpers";
import type { UiHook } from "../types";

jest.mock("../../logic/signTransaction");

const mockedSignTransactionLogic = jest.mocked(signTransaction.signTransactionLogic);

const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

/**
 * Drives the handler's inline `uiNavigation` callback (the one wired to the UI hook) by making
 * `signTransactionLogic` call it and return whatever it resolves to. The signFlowInfos passed
 * here are placeholders — the handler forwards them straight to the UI hook.
 */
function runSignNavigation(account: Account) {
  mockedSignTransactionLogic.mockImplementationOnce(
    async (_ctx, _walletAccountId, _transaction, uiNavigation) =>
      uiNavigation(account, undefined, {
        canEditFees: false,
        hasFeesProvided: false,
        liveTx: {},
      }),
  );
}

describe("createTransactionSignHandler", () => {
  const transaction = createWalletAPIEthereumTransaction();
  const options = undefined;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("resolves the signed operation signature and tracks success when the UI succeeds", async () => {
    const account = createFixtureAccount();
    const signedOperation = createSignedOperation();
    const tracking = createTrackingSpies();
    const uiTxSign: jest.MockedFunction<UiHook["transaction.sign"]> = jest.fn(({ onSuccess }) => {
      onSuccess(signedOperation);
    });

    runSignNavigation(account);

    const deps = makeHandlerDeps({ uiTxSign, accounts: [account], tracking });
    const handler = createTransactionSignHandler(getDepsFrom(deps));

    const result = await handler({
      accountId: walletAccountId,
      transaction,
      options,
      meta: undefined,
    });

    expect(uiTxSign).toHaveBeenCalledTimes(1);
    expect(tracking.signTransactionSuccess).toHaveBeenCalledTimes(1);
    expect(tracking.signTransactionFail).not.toHaveBeenCalled();
    expect(result).toEqual(Buffer.from(signedOperation.signature));
  });

  it("hex-decodes the signature for solana accounts", async () => {
    const account = createFixtureAccount();
    const signedOperation: SignedOperation = {
      ...createSignedOperation(),
      signature: "00ff",
    };
    const tracking = createTrackingSpies();
    const uiTxSign: jest.MockedFunction<UiHook["transaction.sign"]> = jest.fn(({ onSuccess }) => {
      onSuccess(signedOperation);
    });

    // Override the account currency id so the handler treats it as solana.
    const solanaAccount = {
      ...account,
      currency: { ...account.currency, id: "solana" },
    } as Account;
    runSignNavigation(solanaAccount);

    const deps = makeHandlerDeps({
      uiTxSign,
      accounts: [solanaAccount],
      tracking,
    });
    const handler = createTransactionSignHandler(getDepsFrom(deps));

    const result = await handler({
      accountId: walletAccountId,
      transaction,
      options,
      meta: undefined,
    });

    expect(result).toEqual(Buffer.from("00ff", "hex"));
  });

  it("rejects and tracks failure when the UI errors", async () => {
    const account = createFixtureAccount();
    const tracking = createTrackingSpies();
    const uiTxSign: jest.MockedFunction<UiHook["transaction.sign"]> = jest.fn(({ onError }) => {
      onError(new Error("sign failed"));
    });

    runSignNavigation(account);

    const deps = makeHandlerDeps({ uiTxSign, accounts: [account], tracking });
    const handler = createTransactionSignHandler(getDepsFrom(deps));

    await expect(
      handler({
        accountId: walletAccountId,
        transaction,
        options,
        meta: undefined,
      }),
    ).rejects.toThrow("sign failed");
    expect(tracking.signTransactionFail).toHaveBeenCalledTimes(1);
    expect(tracking.signTransactionSuccess).not.toHaveBeenCalled();
  });

  it("ignores callbacks fired after the first one (single-shot guard)", async () => {
    const account = createFixtureAccount();
    const signedOperation = createSignedOperation();
    const tracking = createTrackingSpies();
    const uiTxSign: jest.MockedFunction<UiHook["transaction.sign"]> = jest.fn(
      ({ onSuccess, onError }) => {
        onSuccess(signedOperation);
        onError(new Error("late error"));
      },
    );

    runSignNavigation(account);

    const deps = makeHandlerDeps({ uiTxSign, accounts: [account], tracking });
    const handler = createTransactionSignHandler(getDepsFrom(deps));

    const result = await handler({
      accountId: walletAccountId,
      transaction,
      options,
      meta: undefined,
    });

    expect(result).toEqual(Buffer.from(signedOperation.signature));
    expect(tracking.signTransactionSuccess).toHaveBeenCalledTimes(1);
    expect(tracking.signTransactionFail).not.toHaveBeenCalled();
  });

  it("throws when the UI handler is not configured", async () => {
    const deps = makeHandlerDeps({ uiTxSign: undefined });
    const handler = createTransactionSignHandler(getDepsFrom(deps));

    await expect(
      handler({
        accountId: walletAccountId,
        transaction,
        options,
        meta: undefined,
      }),
    ).rejects.toThrow("transaction.sign UI handler not configured");
    expect(mockedSignTransactionLogic).not.toHaveBeenCalled();
  });
});
