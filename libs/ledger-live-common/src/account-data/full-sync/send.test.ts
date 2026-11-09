import BigNumber from "bignumber.js";
import { firstValueFrom, lastValueFrom, of, throwError, toArray } from "rxjs";
import type { Account, Operation } from "@ledgerhq/types-live";
import {
  SignatureMismatchError,
  SignatureRefusedError,
  type SigningDevice,
} from "@domain/api-account-transaction";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockSendRequest } from "@domain/entity-account-transaction/schema.mock";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { fromLegacyAccount } from "../../account/accountDescriptor";
import { sendFeatures } from "../../bridge/descriptor/send/features";
import { FullSyncSendExpiredError, FullSyncSendOutdatedError } from "./errors";
import { createFullSyncSender, FULL_SYNC_SEND_MAX_HELD, FULL_SYNC_SEND_TTL_MS } from "./send";

const bridge = {
  createTransaction: jest.fn(() => ({ family: "evm", amount: new BigNumber(0), recipient: "" })),
  updateTransaction: jest.fn((transaction: object, patch: object) => ({
    ...transaction,
    ...patch,
  })),
  prepareTransaction: jest.fn(async (_account: Account, transaction: object) => transaction),
  getTransactionStatus: jest.fn(),
  signOperation: jest.fn(),
  broadcast: jest.fn(),
};
jest.mock("../../bridge", () => ({ getAccountBridge: async () => bridge }));

const token = createFixtureTokenAccount("01");
const account: Account = {
  ...genAccount("full-sync-send", { currency: getCryptoCurrencyById("ethereum") }),
  subAccounts: [token],
  pendingOperations: [],
};
const descriptor = fromLegacyAccount(account);
const target = { accountUUID: computeAccountUUID(descriptor), descriptor };
const device = {
  compatDeviceId: "device-1",
  sessionId: "s",
  deviceModelId: "nanoS",
} as unknown as SigningDevice;

const status = (over: object = {}) => ({
  amount: new BigNumber(1000),
  estimatedFees: new BigNumber(21),
  totalSpent: new BigNumber(1021),
  errors: {},
  warnings: {},
  ...over,
});

const named = (name: string, extra: object = {}) =>
  Object.assign(new Error(name.toLowerCase()), { name, ...extra });

const optimistic: Operation = {
  ...account.operations[0],
  id: `${account.id}-0xnew-OUT`,
  hash: "0xnew",
  type: "OUT",
  blockHeight: null,
  blockHash: null,
  date: new Date("2030-01-01T00:00:00.000Z"),
};

function setup(over: { updateAccountWithUpdater?: jest.Mock; now?: () => number } = {}) {
  let current = account;
  const updateAccountWithUpdater =
    over.updateAccountWithUpdater ??
    jest.fn((_id: string, updater: (a: Account) => Account) => {
      current = updater(current);
    });
  const sender = createFullSyncSender(
    {
      findAccount: () => current,
      prepareCurrency: async () => undefined,
      updateAccountWithUpdater,
    },
    over.now,
  );
  return { sender, updateAccountWithUpdater, stored: () => current };
}

async function signedOf(sender: ReturnType<typeof setup>["sender"]) {
  bridge.signOperation.mockReturnValue(
    of(
      { type: "device-signature-requested" },
      { type: "device-signature-granted" },
      { type: "signed", signedOperation: { operation: optimistic, signature: "0xsig" } },
    ),
  );
  const prepared = await sender.prepare(target, mockSendRequest());
  const events = await lastValueFrom(sender.sign(target, prepared, device).pipe(toArray()));
  const last = events.at(-1);
  if (last?.type !== "signed") throw new Error("not signed");
  return { prepared, events, signed: last.signed };
}

beforeEach(() => {
  jest.clearAllMocks();
  bridge.getTransactionStatus.mockResolvedValue(status());
  bridge.broadcast.mockResolvedValue(optimistic);
});

describe("createFullSyncSender", () => {
  it("prepares with the account's bridge and keeps the family's transaction out of the payload", async () => {
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest({ feeStrategy: "fast" }));
    expect(bridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        recipient: "0x0000000000000000000000000000000000000002",
        amount: new BigNumber(1000),
        feesStrategy: "fast",
        subAccountId: undefined,
      }),
    );
    expect(prepared).toEqual(
      expect.objectContaining({
        amount: "1000",
        fees: "21",
        feeAssetId: "ethereum",
        totalSpent: "1021",
        errors: [],
        warnings: [],
        payload: { handle: expect.any(String) },
      }),
    );
  });

  it("sends a token from its token account, and keeps each error's field and params", async () => {
    bridge.getTransactionStatus.mockResolvedValue(
      status({
        errors: {
          amount: named("NotEnoughBalance"),
          gasPrice: named("FeeTooHigh", { ticker: "ETH" }),
        },
      }),
    );
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest({ assetId: token.token.id }));
    expect(bridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ subAccountId: token.id }),
    );
    expect(prepared.errors).toEqual([
      { name: "NotEnoughBalance", message: "notenoughbalance", field: "amount", params: undefined },
      { name: "FeeTooHigh", message: "feetoohigh", field: undefined, params: { ticker: "ETH" } },
    ]);
  });

  it("fails the preparation of a memo the network cannot carry", async () => {
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest({ memo: { value: "123" } }));
    expect(prepared.errors).toEqual([{ name: "MemoNotSupported", message: "", field: "memo" }]);
  });

  it("signs on the executor's device through the bridge, the signature kept out of the payload", async () => {
    const { sender } = setup();
    const { events } = await signedOf(sender);
    expect(bridge.signOperation).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: "device-1", deviceModelId: "nanoS" }),
    );
    expect(events).toEqual([
      { type: "device-signature-requested" },
      { type: "device-signature-granted" },
      { type: "signed", signed: { payload: { handle: expect.any(String) } } },
    ]);
  });

  it("turns the family's refusal on the device into a SignatureRefusedError", async () => {
    const refusal = named(sendFeatures.getUserRefusedTransactionErrorName(account.currency));
    bridge.signOperation.mockReturnValue(throwError(() => refusal));
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest());
    await expect(firstValueFrom(sender.sign(target, prepared, device))).rejects.toBeInstanceOf(
      SignatureRefusedError,
    );
  });

  it("refuses a payload it does not hold, as after a restart", async () => {
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest());
    const lost = { ...prepared, payload: { handle: "elsewhere" } };
    await expect(firstValueFrom(sender.sign(target, lost, device))).rejects.toBeInstanceOf(
      FullSyncSendExpiredError,
    );
  });

  it("broadcasts once, adds the optimistic operation to the legacy account and answers its rows", async () => {
    const { sender, stored } = setup();
    const { prepared, signed } = await signedOf(sender);
    await expect(sender.broadcast(target, prepared, signed)).resolves.toEqual({
      hash: "0xnew",
      operations: [expect.objectContaining({ hash: "0xnew", blockHeight: null })],
    });
    expect(stored().pendingOperations).toEqual([optimistic]);
    await expect(sender.broadcast(target, prepared, signed)).rejects.toBeInstanceOf(
      FullSyncSendExpiredError,
    );
    expect(bridge.broadcast).toHaveBeenCalledTimes(1);
  });

  it("answers the hash of an accepted broadcast even when storing its operation fails", async () => {
    const updateAccountWithUpdater = jest.fn(() => {
      throw new Error("store gone");
    });
    const { sender } = setup({ updateAccountWithUpdater });
    const { prepared, signed } = await signedOf(sender);
    await expect(sender.broadcast(target, prepared, signed)).resolves.toEqual({
      hash: "0xnew",
      operations: [],
    });
  });

  it("refuses to broadcast a signature with another preparation, and keeps both", async () => {
    const { sender } = setup();
    const { prepared, signed } = await signedOf(sender);
    const other = await sender.prepare(target, mockSendRequest({ amount: "5000" }));
    await expect(sender.broadcast(target, other, signed)).rejects.toBeInstanceOf(
      SignatureMismatchError,
    );
    expect(bridge.broadcast).not.toHaveBeenCalled();
    await expect(sender.broadcast(target, prepared, signed)).resolves.toEqual(
      expect.objectContaining({ hash: "0xnew" }),
    );
  });

  it("never resolves a payload of another sender, even one recreated after a restart", async () => {
    const { sender: before } = setup();
    const prepared = await before.prepare(target, mockSendRequest());
    const { sender: after } = setup();
    await after.prepare(target, mockSendRequest());
    await expect(firstValueFrom(after.sign(target, prepared, device))).rejects.toBeInstanceOf(
      FullSyncSendExpiredError,
    );
  });

  it("shares one broadcast between concurrent calls, and lets a failed one be retried", async () => {
    const { sender } = setup();
    const { prepared, signed } = await signedOf(sender);
    bridge.broadcast.mockRejectedValueOnce(new Error("node down"));
    const failing = [
      sender.broadcast(target, prepared, signed),
      sender.broadcast(target, prepared, signed),
    ];
    await expect(Promise.all(failing)).rejects.toThrow("node down");
    expect(bridge.broadcast).toHaveBeenCalledTimes(1);
    const [first, second] = await Promise.all([
      sender.broadcast(target, prepared, signed),
      sender.broadcast(target, prepared, signed),
    ]);
    expect(first).toBe(second);
    expect(bridge.broadcast).toHaveBeenCalledTimes(2);
  });

  it("frees a released preparation and its signatures, and forgets untouched ones", async () => {
    let at = 0;
    const { sender } = setup({ now: () => at });
    const { prepared, signed } = await signedOf(sender);
    sender.release?.(target, prepared);
    await expect(sender.broadcast(target, prepared, signed)).rejects.toBeInstanceOf(
      FullSyncSendExpiredError,
    );
    const stale = await sender.prepare(target, mockSendRequest());
    at += FULL_SYNC_SEND_TTL_MS;
    await expect(firstValueFrom(sender.sign(target, stale, device))).rejects.toBeInstanceOf(
      FullSyncSendExpiredError,
    );
  });

  it("qualifies a memo with the network's default memo type when the request does not", async () => {
    jest.spyOn(sendFeatures, "hasMemoForRecipient").mockReturnValueOnce(true);
    jest.spyOn(sendFeatures, "getMemoDefaultOption").mockReturnValueOnce("MEMO_TEXT");
    bridge.createTransaction.mockReturnValueOnce({
      family: "stellar",
      amount: new BigNumber(0),
      recipient: "",
    });
    const { sender } = setup();
    await sender.prepare(target, mockSendRequest({ memo: { value: "deposit-42" } }));
    expect(bridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ memoType: "MEMO_TEXT", memoValue: "deposit-42" }),
    );
  });

  it("applies custom fees through the send descriptor, and network options as they are", async () => {
    jest.spyOn(sendFeatures, "getCustomFeeConfig").mockReturnValueOnce({
      inputs: [],
      getInitialValues: () => ({}),
      buildTransactionPatch: values => ({ maxFeePerGas: new BigNumber(values.maxFeePerGas) }),
    });
    const { sender } = setup();
    await sender.prepare(
      target,
      mockSendRequest({
        feeStrategy: "custom",
        customFees: { maxFeePerGas: "30" },
        familyOptions: { mode: "send", rbf: true },
      }),
    );
    expect(bridge.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ feesStrategy: "custom", maxFeePerGas: new BigNumber(30) }),
    );
    expect(bridge.updateTransaction).toHaveBeenNthCalledWith(1, expect.anything(), {
      mode: "send",
      rbf: true,
    });
  });

  it("never lets network options override what the request says", async () => {
    const { sender } = setup();
    await sender.prepare(
      target,
      mockSendRequest({ familyOptions: { recipient: "0xelsewhere", amount: "1" } }),
    );
    expect(bridge.updateTransaction).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        recipient: "0x0000000000000000000000000000000000000002",
        amount: new BigNumber(1000),
      }),
    );
  });

  it("reports the fees it cannot apply instead of signing other ones", async () => {
    jest.spyOn(sendFeatures, "getCustomFeeConfig").mockReturnValueOnce(null);
    const { sender } = setup();
    const custom = await sender.prepare(
      target,
      mockSendRequest({ feeStrategy: "custom", customFees: { feePerByte: "50" } }),
    );
    expect(custom.errors).toEqual([{ name: "CustomFeesNotSupported", message: "", field: "fees" }]);
    const unknown = await sender.prepare(target, mockSendRequest({ feeStrategy: "turbo" }));
    expect(unknown.errors).toEqual([
      { name: "FeeStrategyNotSupported", message: "", field: "fees" },
    ]);
  });

  it("holds a bounded number of preparations, the oldest freed first", async () => {
    const { sender } = setup();
    const oldest = await sender.prepare(target, mockSendRequest());
    for (let index = 0; index < FULL_SYNC_SEND_MAX_HELD; index++) {
      await sender.prepare(target, mockSendRequest());
    }
    await expect(firstValueFrom(sender.sign(target, oldest, device))).rejects.toBeInstanceOf(
      FullSyncSendExpiredError,
    );
  });

  it("fails the preparation of a fee asset the network does not offer", async () => {
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest({ feeAssetId: token.token.id }));
    expect(prepared.errors).toEqual([{ name: "FeeAssetNotSupported", message: "", field: "fees" }]);
  });

  it("estimates each strategy through the bridge, holding no preparation", async () => {
    bridge.getTransactionStatus
      .mockResolvedValueOnce(status({ estimatedFees: new BigNumber(10) }))
      .mockResolvedValueOnce(status({ estimatedFees: new BigNumber(30) }));
    const { sender } = setup();
    await expect(
      sender.estimateFees?.(target, mockSendRequest(), ["slow", "fast"]),
    ).resolves.toEqual([
      { strategy: "slow", fees: "10", feeAssetId: "ethereum" },
      { strategy: "fast", fees: "30", feeAssetId: "ethereum" },
    ]);
  });

  it("shows zero for a negative send-max amount, and keeps its error", async () => {
    bridge.getTransactionStatus.mockResolvedValueOnce(
      status({ amount: new BigNumber(-5), errors: { amount: named("NotEnoughBalance") } }),
    );
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest({ useAllAmount: true }));
    expect(prepared.amount).toBe("0");
    expect(prepared.errors).toEqual([expect.objectContaining({ name: "NotEnoughBalance" })]);
  });

  it("labels fees with the asset the network always pays them in", async () => {
    jest.spyOn(sendFeatures, "getFeeAssetId").mockReturnValueOnce("vechain/vip180/vtho");
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest());
    expect(prepared.feeAssetId).toBe("vechain/vip180/vtho");
  });

  it("estimates a fee-rate preset through the bridge, a rate not being a total", async () => {
    jest
      .spyOn(sendFeatures, "getFeePresetOptions")
      .mockReturnValueOnce([{ id: "slow", amount: new BigNumber(2) }]);
    jest.spyOn(sendFeatures, "hasFeeRateLegend").mockReturnValueOnce(true);
    bridge.getTransactionStatus.mockResolvedValueOnce(
      status({ estimatedFees: new BigNumber(450) }),
    );
    const { sender } = setup();
    await expect(sender.estimateFees?.(target, mockSendRequest(), ["slow"])).resolves.toEqual([
      { strategy: "slow", fees: "450", feeAssetId: "ethereum" },
    ]);
  });

  it("refuses to sign what changed since the summary, as a send-max after a balance change", async () => {
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest({ useAllAmount: true }));
    bridge.getTransactionStatus.mockResolvedValueOnce(
      status({ amount: new BigNumber(900), totalSpent: new BigNumber(921) }),
    );
    await expect(firstValueFrom(sender.sign(target, prepared, device))).rejects.toBeInstanceOf(
      FullSyncSendOutdatedError,
    );
    expect(bridge.signOperation).not.toHaveBeenCalled();
  });

  it("refuses to sign once a fresh status blocks it, even with the same amounts", async () => {
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest());
    bridge.getTransactionStatus.mockResolvedValueOnce(
      status({ errors: { amount: named("NotEnoughBalance") } }),
    );
    await expect(firstValueFrom(sender.sign(target, prepared, device))).rejects.toBeInstanceOf(
      FullSyncSendOutdatedError,
    );
    expect(bridge.signOperation).not.toHaveBeenCalled();
  });

  it("accepts the asset the network always pays fees in, and refuses the coin it does not", async () => {
    jest.spyOn(sendFeatures, "getFeeAssetId").mockReturnValue("vechain/vip180/vtho");
    const { sender } = setup();
    const vtho = await sender.prepare(
      target,
      mockSendRequest({ feeAssetId: "vechain/vip180/vtho" }),
    );
    expect(vtho.errors).toEqual([]);
    const native = await sender.prepare(target, mockSendRequest({ feeAssetId: "ethereum" }));
    expect(native.errors).toEqual([{ name: "FeeAssetNotSupported", message: "", field: "fees" }]);
    jest.mocked(sendFeatures.getFeeAssetId).mockRestore();
  });

  it("refuses a signature with another preparation even while its own broadcast is in flight", async () => {
    const { sender } = setup();
    const { prepared, signed } = await signedOf(sender);
    const other = await sender.prepare(target, mockSendRequest({ amount: "5000" }));
    const own = sender.broadcast(target, prepared, signed);
    await expect(sender.broadcast(target, other, signed)).rejects.toBeInstanceOf(
      SignatureMismatchError,
    );
    await expect(own).resolves.toEqual(expect.objectContaining({ hash: "0xnew" }));
    expect(bridge.broadcast).toHaveBeenCalledTimes(1);
  });

  it("prepares the held transaction again on the current account before signing it", async () => {
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest());
    bridge.prepareTransaction.mockImplementationOnce(async (_account, transaction) => ({
      ...transaction,
      refreshed: true,
    }));
    bridge.signOperation.mockReturnValue(of({ type: "device-signature-requested" }));
    await lastValueFrom(sender.sign(target, prepared, device).pipe(toArray()));
    expect(bridge.signOperation).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.objectContaining({ refreshed: true }) }),
    );
  });

  it("refuses to sign when only the fee changed since the summary, as a fee paid in another asset", async () => {
    const { sender } = setup();
    const prepared = await sender.prepare(target, mockSendRequest());
    bridge.getTransactionStatus.mockResolvedValueOnce(status({ estimatedFees: new BigNumber(40) }));
    await expect(firstValueFrom(sender.sign(target, prepared, device))).rejects.toBeInstanceOf(
      FullSyncSendOutdatedError,
    );
    expect(bridge.signOperation).not.toHaveBeenCalled();
  });
});
