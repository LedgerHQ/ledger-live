import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { createTransactionSignAndBroadcastHandler } from "../transactionSignAndBroadcast";
import * as signTransaction from "../../logic/signTransaction";
import * as broadcastTransaction from "../../logic/broadcastTransaction";
import * as bridge from "../../../bridge";
import { makeHandlerDeps, getDepsFrom, createTrackingSpies } from "./testHelpers";
import {
  createFixtureAccount,
  createSignedOperation,
  createWalletAPIEthereumTransaction,
} from "../../logic/__tests__/testHelpers";
import type { UiHook } from "../types";

jest.mock("../../logic/signTransaction");
jest.mock("../../logic/broadcastTransaction");
jest.mock("../../../bridge");

const mockedSignTransactionLogic = jest.mocked(signTransaction.signTransactionLogic);
const mockedBroadcastTransactionLogic = jest.mocked(broadcastTransaction.broadcastTransactionLogic);
const mockedGetAccountBridge = jest.mocked(bridge.getAccountBridge);

const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";

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

/** Mocks broadcastTransactionLogic so it invokes the handler's inner broadcast callback. */
function runBroadcastNavigation(account: Account, signedOperation: SignedOperation) {
  mockedBroadcastTransactionLogic.mockImplementationOnce(
    async (_ctx, _walletAccountId, _signedOperation, uiNavigation) =>
      uiNavigation(account, undefined, signedOperation),
  );
}

describe("createTransactionSignAndBroadcastHandler", () => {
  const transaction = createWalletAPIEthereumTransaction();
  const options = undefined;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("signs, broadcasts and returns the optimistic operation hash, calling the broadcast UI", async () => {
    const account = createFixtureAccount();
    const signedOperation = createSignedOperation();
    const optimisticOperation: Operation = {
      ...signedOperation.operation,
      hash: "broadcasted",
    };
    const tracking = createTrackingSpies();

    const uiTxSign: jest.MockedFunction<UiHook["transaction.sign"]> = jest.fn(({ onSuccess }) => {
      onSuccess(signedOperation);
    });
    const uiTxBroadcast = jest.fn();
    const broadcast = jest.fn().mockResolvedValue(optimisticOperation);
    mockedGetAccountBridge.mockReturnValue({ broadcast } as never);

    runSignNavigation(account);
    runBroadcastNavigation(account, signedOperation);

    const deps = makeHandlerDeps({
      uiTxSign,
      uiTxBroadcast,
      accounts: [account],
      tracking,
      config: { mevProtected: false } as never,
    });
    const handler = createTransactionSignAndBroadcastHandler(getDepsFrom(deps));

    const result = await handler({
      accountId: walletAccountId,
      transaction,
      options,
      meta: undefined,
    });

    expect(tracking.signTransactionSuccess).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(tracking.broadcastSuccess).toHaveBeenCalledTimes(1);
    expect(uiTxBroadcast).toHaveBeenCalledTimes(1);
    expect(uiTxBroadcast).toHaveBeenCalledWith(account, undefined, account, optimisticOperation);
    expect(result).toBe("broadcasted");
  });

  it("forwards isEmbeddedSwap/partner/swapEntryPoint tracking args and works without a broadcast UI", async () => {
    const account = createFixtureAccount();
    const signedOperation = createSignedOperation();
    const optimisticOperation: Operation = {
      ...signedOperation.operation,
      hash: "broadcasted",
    };
    const tracking = createTrackingSpies();

    const uiTxSign: jest.MockedFunction<UiHook["transaction.sign"]> = jest.fn(({ onSuccess }) => {
      onSuccess(signedOperation);
    });
    const broadcast = jest.fn().mockResolvedValue(optimisticOperation);
    mockedGetAccountBridge.mockReturnValue({ broadcast } as never);

    runSignNavigation(account);
    runBroadcastNavigation(account, signedOperation);

    const deps = makeHandlerDeps({
      uiTxSign,
      uiTxBroadcast: undefined,
      accounts: [account],
      tracking,
      config: { mevProtected: false } as never,
    });
    const handler = createTransactionSignAndBroadcastHandler(getDepsFrom(deps));

    const result = await handler({
      accountId: walletAccountId,
      transaction,
      options,
      meta: {
        isEmbedded: true,
        partner: "somePartner",
        swapEntryPoint: "someEntry",
      },
    });

    expect(tracking.signTransactionSuccess).toHaveBeenCalledWith(
      expect.anything(),
      true,
      "somePartner",
      "someEntry",
    );
    expect(result).toBe("broadcasted");
  });

  it("tracks broadcast failure and rethrows when the bridge broadcast fails", async () => {
    const account = createFixtureAccount();
    const signedOperation = createSignedOperation();
    const tracking = createTrackingSpies();

    const uiTxSign: jest.MockedFunction<UiHook["transaction.sign"]> = jest.fn(({ onSuccess }) => {
      onSuccess(signedOperation);
    });
    const broadcast = jest.fn().mockRejectedValue(new Error("broadcast failed"));
    mockedGetAccountBridge.mockReturnValue({ broadcast } as never);

    runSignNavigation(account);
    runBroadcastNavigation(account, signedOperation);

    const deps = makeHandlerDeps({
      uiTxSign,
      uiTxBroadcast: jest.fn(),
      accounts: [account],
      tracking,
      config: { mevProtected: false } as never,
    });
    const handler = createTransactionSignAndBroadcastHandler(getDepsFrom(deps));

    await expect(
      handler({
        accountId: walletAccountId,
        transaction,
        options,
        meta: undefined,
      }),
    ).rejects.toThrow("broadcast failed");
    expect(tracking.broadcastFail).toHaveBeenCalledTimes(1);
  });

  it("rejects and tracks failure when the sign UI errors", async () => {
    const account = createFixtureAccount();
    const tracking = createTrackingSpies();
    const uiTxSign: jest.MockedFunction<UiHook["transaction.sign"]> = jest.fn(({ onError }) => {
      onError(new Error("sign failed"));
    });

    runSignNavigation(account);

    const deps = makeHandlerDeps({ uiTxSign, accounts: [account], tracking });
    const handler = createTransactionSignAndBroadcastHandler(getDepsFrom(deps));

    await expect(
      handler({
        accountId: walletAccountId,
        transaction,
        options,
        meta: undefined,
      }),
    ).rejects.toThrow("sign failed");
    expect(tracking.signTransactionFail).toHaveBeenCalledTimes(1);
    expect(mockedBroadcastTransactionLogic).not.toHaveBeenCalled();
  });

  it("throws when the UI handler is not configured", async () => {
    const deps = makeHandlerDeps({ uiTxSign: undefined });
    const handler = createTransactionSignAndBroadcastHandler(getDepsFrom(deps));

    await expect(
      handler({
        accountId: walletAccountId,
        transaction,
        options,
        meta: undefined,
      }),
    ).rejects.toThrow("transaction.signAndBroadcast UI handler not configured");
    expect(mockedSignTransactionLogic).not.toHaveBeenCalled();
  });
});
