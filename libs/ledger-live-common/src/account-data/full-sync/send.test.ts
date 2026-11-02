import { BigNumber } from "bignumber.js";
import { firstValueFrom, lastValueFrom, of, throwError, toArray } from "rxjs";
import type { Account, Operation } from "@ledgerhq/types-live";
import { SignatureRefusedError, type SigningDevice } from "@domain/api-account-transaction";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockSendRequest } from "@domain/entity-account-transaction/schema.mock";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { createFixtureTokenAccount } from "../../mock/fixtures/cryptoCurrencies";
import { fromLegacyAccount } from "../../account/accountDescriptor";
import { sendFeatures } from "../../bridge/descriptor/send/features";
import { FullSyncSendExpiredError } from "./errors";
import { createFullSyncSender } from "./send";

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
const device = { compatDeviceId: "device-1", sessionId: "s" } as unknown as SigningDevice;

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

function setup(over: { updateAccountWithUpdater?: jest.Mock } = {}) {
  let current = account;
  const updateAccountWithUpdater =
    over.updateAccountWithUpdater ??
    jest.fn((_id: string, updater: (a: Account) => Account) => {
      current = updater(current);
    });
  const sender = createFullSyncSender({
    findAccount: () => current,
    prepareCurrency: async () => undefined,
    updateAccountWithUpdater,
  });
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
    const prepared = await sender.prepare(target, mockSendRequest({ memo: "123" }));
    expect(prepared.errors).toEqual([{ name: "MemoNotSupported", message: "", field: "memo" }]);
  });

  it("signs on the executor's device through the bridge, the signature kept out of the payload", async () => {
    const { sender } = setup();
    const { events } = await signedOf(sender);
    expect(bridge.signOperation).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: "device-1" }),
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
});
