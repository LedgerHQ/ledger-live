import BigNumber from "bignumber.js";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react";
import { of } from "rxjs";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { sourceIdOf } from "@domain/api-account-data/testing";
import type {
  AccountSendCapability,
  AccountSendingSource,
  SigningDevice,
} from "@domain/api-account-transaction";
import { accountDataSlice } from "@domain/entity-account-data";
import { accountsSlice, AccountIdSchema, legacyAccountsSynced } from "@domain/entity-account";
import { accountBalancesSlice } from "@domain/entity-account-balance";
import { accountReceivesSlice } from "@domain/entity-account-receive";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import {
  accountOperationsSlice,
  accountPendingOperationsSlice,
  TransactionHashSchema,
} from "@domain/entity-account-operation";
import { mockPreparedTransaction } from "@domain/entity-account-transaction/schema.mock";
import { walletApiIdOf } from "@features/platform-wallet-api-accounts";
import type { WalletHandlers } from "@ledgerhq/wallet-api-server";
import { NotServedByAccountDataError } from "./routeHandlers";
import {
  useAccountDataHandlers,
  UserRefusedOnDevice,
  type AccountDataUiHook,
} from "./useAccountDataHandlers";

const ethereum = mockAddressAccountDescriptor();
const bitcoin = mockUtxoAccountDescriptor();
const ETH_ID = AccountIdSchema.parse(`js:2:ethereum:${ethereum.address}:`);
const BTC_ID = AccountIdSchema.parse(`js:2:bitcoin:${bitcoin.xpub}:native_segwit`);
const recipient = "0x0000000000000000000000000000000000000002";
const hash = TransactionHashSchema.parse("0xhash");
const device = { sessionId: "session", compatDeviceId: "device" } as unknown as SigningDevice;

function capability(over: Partial<AccountSendCapability> = {}): AccountSendCapability {
  return {
    supports: descriptor => descriptor.type === "address",
    prepare: jest.fn(async (_target, request) =>
      mockPreparedTransaction({ request, amount: "900" }),
    ),
    sign: jest.fn(() =>
      of({ type: "signed" as const, signed: { payload: { handle: "h" }, serialized: "cafe" } }),
    ),
    broadcast: jest.fn(async () => ({ hash, operations: [] })),
    signMessage: jest.fn(() => of({ type: "signed" as const, signature: "beef" })),
    ...over,
  };
}

function setup(send: AccountSendCapability | null = capability()) {
  const reader: AccountDataSource = {
    id: sourceIdOf("reader"),
    supports: () => true,
    read: { receive: async () => mockAccountReceive({ address: "0xreceive" }) },
  };
  const sender: AccountSendingSource | undefined = send ? { ...reader, send } : undefined;
  const sources: AccountDataSource[] = [sender ?? reader];
  const store = configureStore({
    reducer: {
      accountData: accountDataSlice.reducer,
      accountBalances: accountBalancesSlice.reducer,
      accountReceives: accountReceivesSlice.reducer,
      accountEntries: accountsSlice.reducer,
      accountOperations: accountOperationsSlice.reducer,
      accountPendingOperations: accountPendingOperationsSlice.reducer,
    },
    middleware: getDefault =>
      getDefault({ thunk: { extraArgument: accountDataExtra(sources) }, serializableCheck: false }),
  });
  store.dispatch(
    legacyAccountsSynced([
      { legacyId: ETH_ID, descriptor: ethereum, accountUUID: computeAccountUUID(ethereum) },
      { legacyId: BTC_ID, descriptor: bitcoin, accountUUID: computeAccountUUID(bitcoin) },
    ]),
  );
  const ui = {
    "transaction.sign": jest.fn(params => {
      params.sign(device).subscribe(event => {
        if (event.type === "signed") params.onSuccess(event.signed);
      });
    }),
    "message.sign": jest.fn(params => {
      params.sign(device).subscribe(event => {
        if (event.type === "signed") params.onSuccess(event.signature);
      });
    }),
    "account.receive": jest.fn(params => params.onSuccess(params.receive.address)),
  } satisfies AccountDataUiHook;
  const context = {
    session: { cancelOnClose: <T>(p: Promise<T> | T) => Promise.resolve(p), assertOpen: jest.fn() },
    manifestId: "app",
    mevProtected: true,
  };
  const { result } = renderHook(() => useAccountDataHandlers(store.dispatch, ui, context));
  const handler = <K extends keyof WalletHandlers>(name: K): WalletHandlers[K] => {
    const found = result.current[name];
    if (!found) throw new Error(`no ${name}`);
    return found;
  };
  return { handler, ui, send, context };
}

const transfer = { family: "ethereum" as const, amount: new BigNumber(1000), recipient };

describe("useAccountDataHandlers", () => {
  it("signs a plain transfer through the source and returns the serialized transaction", async () => {
    const { handler, ui } = setup();

    const signed = await handler("transaction.sign")({
      accountId: walletApiIdOf(ETH_ID),
      transaction: transfer,
      meta: undefined,
    });

    expect(signed).toEqual(Buffer.from("cafe", "hex"));
    expect(ui["transaction.sign"]).toHaveBeenCalledWith(
      expect.objectContaining({
        prepared: expect.objectContaining({
          prepared: expect.objectContaining({ amount: "900" }),
        }),
      }),
    );
  });

  it("broadcasts after signing and returns the hash", async () => {
    const { handler, send } = setup();

    await expect(
      handler("transaction.signAndBroadcast")({
        accountId: walletApiIdOf(ETH_ID),
        transaction: transfer,
        meta: undefined,
      }),
    ).resolves.toBe("0xhash");
    expect(send?.broadcast).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      { mevProtected: true, origin: { type: "live-app", name: "app" } },
    );
  });

  it("hands a contract call back to legacy", async () => {
    const { handler } = setup();

    await expect(
      handler("transaction.sign")({
        accountId: walletApiIdOf(ETH_ID),
        transaction: { ...transfer, data: Buffer.from("a9059cbb", "hex") },
        meta: undefined,
      }),
    ).rejects.toBeInstanceOf(NotServedByAccountDataError);
  });

  it("hands an account no source sends from back to legacy", async () => {
    const { handler } = setup(null);

    await expect(
      handler("transaction.sign")({
        accountId: walletApiIdOf(ETH_ID),
        transaction: transfer,
        meta: undefined,
      }),
    ).rejects.toBeInstanceOf(NotServedByAccountDataError);
  });

  it("hands an unknown account back to legacy", async () => {
    const { handler } = setup();

    await expect(handler("bitcoin.getXPub")({ accountId: "unknown" })).rejects.toBeInstanceOf(
      NotServedByAccountDataError,
    );
  });

  it("reads the xpub from a UTXO descriptor", async () => {
    const { handler } = setup();

    await expect(handler("bitcoin.getXPub")({ accountId: walletApiIdOf(BTC_ID) })).resolves.toBe(
      bitcoin.xpub,
    );
  });

  it("estimates the max spendable with a send of everything", async () => {
    const { handler, send } = setup();

    await expect(
      handler("account.getMaxSpendable")({ accountId: walletApiIdOf(ETH_ID) }),
    ).resolves.toBe("900");
    expect(send?.prepare).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ useAllAmount: true }),
    );
  });

  it("signs a message and returns the signature bytes", async () => {
    const { handler } = setup();

    await expect(
      handler("message.sign")({
        accountId: walletApiIdOf(ETH_ID),
        message: Buffer.from("hello"),
        meta: undefined,
      }),
    ).resolves.toEqual(Buffer.from("beef", "hex"));
  });

  it("receives on the address of the receive kind", async () => {
    const { handler } = setup();

    await expect(handler("account.receive")({ accountId: walletApiIdOf(ETH_ID) })).resolves.toBe(
      "0xreceive",
    );
  });

  it("rejects as a refusal when the user closes the screen", async () => {
    const { handler, ui } = setup();
    ui["transaction.sign"].mockImplementation(params => params.onCancel());

    await expect(
      handler("transaction.sign")({
        accountId: walletApiIdOf(ETH_ID),
        transaction: transfer,
        meta: undefined,
      }),
    ).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("hands a request for another device app back to legacy", async () => {
    const { handler } = setup();

    await expect(
      handler("transaction.sign")({
        accountId: walletApiIdOf(ETH_ID),
        transaction: transfer,
        options: { hwAppId: "Plugin" },
        meta: undefined,
      }),
    ).rejects.toBeInstanceOf(NotServedByAccountDataError);
  });

  it("hands a transaction of another family back to legacy", async () => {
    const { handler } = setup();

    await expect(
      handler("transaction.sign")({
        accountId: walletApiIdOf(ETH_ID),
        transaction: { family: "bitcoin", amount: new BigNumber(1), recipient: "bc1q" },
        meta: undefined,
      }),
    ).rejects.toBeInstanceOf(NotServedByAccountDataError);
  });

  it("hands the max spendable back to legacy when the preparation reports an error", async () => {
    const { handler } = setup(
      capability({
        prepare: jest.fn(async (_target, request) =>
          mockPreparedTransaction({
            request,
            errors: [{ name: "InvalidAddressBecauseDestinationIsAlsoSource", message: "self" }],
          }),
        ),
      }),
    );

    await expect(
      handler("account.getMaxSpendable")({ accountId: walletApiIdOf(ETH_ID) }),
    ).rejects.toBeInstanceOf(NotServedByAccountDataError);
  });
});
