import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import { createBitcoinSignPsbtHandler } from "../bitcoinSignPsbt";
import * as signRawTransaction from "../../logic/signRawTransaction";
import * as broadcastTransaction from "../../logic/broadcastTransaction";
import * as bridge from "../../../bridge";
import { makeHandlerDeps, getDepsFrom, createTrackingSpies } from "./testHelpers";
import { createFixtureAccount, createSignedOperation } from "../../logic/__tests__/testHelpers";
import type { UiHook } from "../types";

jest.mock("../../logic/signRawTransaction");
jest.mock("../../logic/broadcastTransaction");
jest.mock("../../../bridge");

const mockedSignRawTransactionLogic = jest.mocked(signRawTransaction.signRawTransactionLogic);
const mockedBroadcastTransactionLogic = jest.mocked(broadcastTransaction.broadcastTransactionLogic);
const mockedGetAccountBridge = jest.mocked(bridge.getAccountBridge);

const walletAccountId = "806ea21d-f5f0-425a-add3-39d4b78209f1";
const psbt = "cHNidP8B";

function createPsbtSignedOperation(psbtSigned = "signed-psbt"): SignedOperation {
  return { ...createSignedOperation(), rawData: { psbtSigned } };
}

function runSignNavigation(account: Account) {
  mockedSignRawTransactionLogic.mockImplementationOnce(
    async (_ctx, _walletAccountId, transaction, uiNavigation) =>
      uiNavigation(account, undefined, transaction),
  );
}

function runBroadcastNavigation(account: Account, signedOperation: SignedOperation) {
  mockedBroadcastTransactionLogic.mockImplementationOnce(
    async (_ctx, _walletAccountId, _signedOperation, uiNavigation) =>
      uiNavigation(account, undefined, signedOperation),
  );
}

describe("createBitcoinSignPsbtHandler", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the signed psbt without broadcasting", async () => {
    const account = createFixtureAccount();
    const signedOperation = createPsbtSignedOperation();
    const tracking = createTrackingSpies();
    const uiTxSignRaw: jest.MockedFunction<UiHook["transaction.signRaw"]> = jest.fn(
      ({ onSuccess }) => {
        onSuccess(signedOperation);
      },
    );

    runSignNavigation(account);

    const deps = makeHandlerDeps({
      uiTxSignRaw,
      accounts: [account],
      tracking,
    });
    const handler = createBitcoinSignPsbtHandler(getDepsFrom(deps));

    const result = await handler({
      accountId: walletAccountId,
      psbt,
      broadcast: false,
    });

    expect(tracking.signRawTransactionSuccess).toHaveBeenCalledTimes(1);
    expect(mockedBroadcastTransactionLogic).not.toHaveBeenCalled();
    expect(result).toEqual({ psbtSigned: "signed-psbt" });
  });

  it("signs and broadcasts when broadcast is true, calling the broadcast UI", async () => {
    const account = createFixtureAccount();
    const signedOperation = createPsbtSignedOperation();
    const optimisticOperation: Operation = {
      ...signedOperation.operation,
      hash: "broadcasted",
    };
    const tracking = createTrackingSpies();
    const uiTxSignRaw: jest.MockedFunction<UiHook["transaction.signRaw"]> = jest.fn(
      ({ onSuccess }) => {
        onSuccess(signedOperation);
      },
    );
    const uiTxBroadcast = jest.fn();
    const broadcast = jest.fn().mockResolvedValue(optimisticOperation);
    mockedGetAccountBridge.mockReturnValue({ broadcast } as never);

    runSignNavigation(account);
    runBroadcastNavigation(account, signedOperation);

    const deps = makeHandlerDeps({
      uiTxSignRaw,
      uiTxBroadcast,
      accounts: [account],
      tracking,
    });
    const handler = createBitcoinSignPsbtHandler(getDepsFrom(deps));

    const result = await handler({
      accountId: walletAccountId,
      psbt,
      broadcast: true,
    });

    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(tracking.broadcastSuccess).toHaveBeenCalledTimes(1);
    expect(uiTxBroadcast).toHaveBeenCalledWith(account, undefined, account, optimisticOperation);
    expect(result).toEqual({
      psbtSigned: "signed-psbt",
      txHash: "broadcasted",
    });
  });

  it("throws when the signed operation is missing psbtSigned in rawData", async () => {
    const account = createFixtureAccount();
    const signedOperation = createSignedOperation(); // no rawData
    const tracking = createTrackingSpies();
    const uiTxSignRaw: jest.MockedFunction<UiHook["transaction.signRaw"]> = jest.fn(
      ({ onSuccess }) => {
        onSuccess(signedOperation);
      },
    );

    runSignNavigation(account);

    const deps = makeHandlerDeps({
      uiTxSignRaw,
      accounts: [account],
      tracking,
    });
    const handler = createBitcoinSignPsbtHandler(getDepsFrom(deps));

    await expect(handler({ accountId: walletAccountId, psbt, broadcast: false })).rejects.toThrow(
      "Missing psbtSigned in signed operation rawData",
    );
  });

  it("rejects and tracks failure when the sign UI errors", async () => {
    const account = createFixtureAccount();
    const tracking = createTrackingSpies();
    const uiTxSignRaw: jest.MockedFunction<UiHook["transaction.signRaw"]> = jest.fn(
      ({ onError }) => {
        onError(new Error("psbt sign failed"));
      },
    );

    runSignNavigation(account);

    const deps = makeHandlerDeps({
      uiTxSignRaw,
      accounts: [account],
      tracking,
    });
    const handler = createBitcoinSignPsbtHandler(getDepsFrom(deps));

    await expect(handler({ accountId: walletAccountId, psbt, broadcast: false })).rejects.toThrow(
      "psbt sign failed",
    );
    expect(tracking.signRawTransactionFail).toHaveBeenCalledTimes(1);
  });

  it("throws when the UI handler is not configured", async () => {
    const deps = makeHandlerDeps({ uiTxSignRaw: undefined });
    const handler = createBitcoinSignPsbtHandler(getDepsFrom(deps));

    await expect(handler({ accountId: walletAccountId, psbt, broadcast: false })).rejects.toThrow(
      "bitcoin.signPsbt UI handler not configured",
    );
    expect(mockedSignRawTransactionLogic).not.toHaveBeenCalled();
  });
});
