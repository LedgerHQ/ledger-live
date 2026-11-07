import { configureStore } from "@reduxjs/toolkit";
import {
  AccountDataNotServedError,
  accountDataExtra,
  addAccountDataSource,
  type AccountDataSource,
} from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import {
  mockAddressAccountDescriptor,
  mockUtxoAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import {
  accountOperationsSlice,
  accountPendingOperationsSlice,
  selectAccountOperationsWithPending,
  TransactionHashSchema,
} from "@domain/entity-account-operation";
import { mockAccountOperation } from "@domain/entity-account-operation/schema.mock";
import {
  mockPreparedTransaction,
  mockSendRequest,
} from "@domain/entity-account-transaction/schema.mock";
import { firstValueFrom, lastValueFrom, of, toArray } from "rxjs";
import { NoSendingSourceError, TransactionNotSignableError } from "./errors";
import type { AccountSendCapability, AccountSendingSource, SigningDevice } from "./source";
import { broadcastSend, prepareSend, signSend } from "./thunks";

const ethereum = mockAddressAccountDescriptor();
const bitcoin = mockUtxoAccountDescriptor();
const accountUUID = computeAccountUUID(ethereum);
const request = mockSendRequest();
const hash = TransactionHashSchema.parse("0xhash");
const device = { sessionId: "session", compatDeviceId: "device" } as unknown as SigningDevice;
const pendingRow = mockAccountOperation({ id: "op-pending", hash: "0xhash", blockHeight: null });

function capability(over: Partial<AccountSendCapability> = {}): AccountSendCapability {
  return {
    supports: descriptor => descriptor.network === ethereum.network,
    prepare: jest.fn(async (_target, asked) => mockPreparedTransaction({ request: asked })),
    sign: jest.fn((_target, prepared) =>
      of(
        { type: "device-signature-requested" as const },
        { type: "device-signature-granted" as const },
        { type: "signed" as const, signed: { payload: { of: prepared.amount } } },
      ),
    ),
    broadcast: jest.fn(async () => ({ hash, operations: [pendingRow] })),
    ...over,
  };
}

const source = (id: string, send = capability()): AccountSendingSource => ({
  id: AccountDataSourceIdSchema.parse(id),
  supports: () => true,
  send,
});

const readOnly: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("read-only"),
  supports: () => true,
  read: {},
};

function makeStore(sources: readonly AccountDataSource[]) {
  return configureStore({
    reducer: {
      accountOperations: accountOperationsSlice.reducer,
      accountPendingOperations: accountPendingOperationsSlice.reducer,
    },
    middleware: getDefault => getDefault({ thunk: { extraArgument: accountDataExtra(sources) } }),
  });
}

describe("sending from an account", () => {
  it("should prepare, sign and broadcast on the first source that sends from the account", async () => {
    const send = capability();
    const store = makeStore([readOnly, source("first", send), source("second")]);
    const prepared = await store.dispatch(prepareSend(ethereum, request));
    expect(prepared.sourceId).toBe("first");
    const events = await lastValueFrom(store.dispatch(signSend(prepared))(device).pipe(toArray()));
    expect(events.map(event => event.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
    const signed = events.at(-1);
    if (signed?.type !== "signed") throw new Error("not signed");
    await expect(store.dispatch(broadcastSend(prepared, signed.signed))).resolves.toEqual({
      hash,
      operations: [pendingRow],
    });
    expect(send.sign).toHaveBeenCalledWith(prepared.target, prepared.prepared, device);
    expect(selectAccountOperationsWithPending(store.getState(), accountUUID)).toEqual([pendingRow]);
  });

  it("should bind a signature to the preparation it signed, whatever was prepared after", async () => {
    const store = makeStore([source("first")]);
    const first = await store.dispatch(prepareSend(ethereum, request));
    await store.dispatch(prepareSend(ethereum, mockSendRequest({ amount: "5000" })));
    const events = await lastValueFrom(store.dispatch(signSend(first))(device).pipe(toArray()));
    expect(events.at(-1)).toEqual({ type: "signed", signed: { payload: { of: "1000" } } });
  });

  it("should hand the account to the next source when one does not serve it", async () => {
    const declining = capability({
      prepare: jest.fn(async () => {
        throw new AccountDataNotServedError("not this one");
      }),
    });
    const store = makeStore([source("first", declining), source("second")]);
    await expect(store.dispatch(prepareSend(ethereum, request))).resolves.toEqual(
      expect.objectContaining({ sourceId: "second" }),
    );
  });

  it("should fail when no source sends from the account, and on any other preparation error", async () => {
    const store = makeStore([readOnly, source("first")]);
    await expect(store.dispatch(prepareSend(bitcoin, request))).rejects.toBeInstanceOf(
      NoSendingSourceError,
    );
    const broken = makeStore([
      source("first", capability({ prepare: jest.fn().mockRejectedValue(new Error("node down")) })),
      source("second"),
    ]);
    await expect(broken.dispatch(prepareSend(ethereum, request))).rejects.toThrow("node down");
  });

  it("should not sign a preparation with errors", async () => {
    const send = capability({
      prepare: async () =>
        mockPreparedTransaction({ errors: [{ name: "NotEnoughBalance", message: "" }] }),
    });
    const store = makeStore([source("first", send)]);
    const prepared = await store.dispatch(prepareSend(ethereum, request));
    await expect(firstValueFrom(store.dispatch(signSend(prepared))(device))).rejects.toBeInstanceOf(
      TransactionNotSignableError,
    );
    expect(send.sign).not.toHaveBeenCalled();
  });

  it("should sign and broadcast only on the source that prepared, even when it is gone", async () => {
    const store = makeStore([source("first")]);
    const runtime = capability();
    const remove = store.dispatch(
      addAccountDataSource(source("runtime", runtime), { first: true }),
    );
    const prepared = await store.dispatch(prepareSend(ethereum, request));
    expect(prepared.sourceId).toBe("runtime");
    remove();
    await expect(firstValueFrom(store.dispatch(signSend(prepared))(device))).rejects.toBeInstanceOf(
      NoSendingSourceError,
    );
    await expect(store.dispatch(broadcastSend(prepared, { payload: null }))).rejects.toBeInstanceOf(
      NoSendingSourceError,
    );
    expect(runtime.sign).not.toHaveBeenCalled();
  });

  it("should add no pending row when the source cannot tell it", async () => {
    const store = makeStore([
      source("first", capability({ broadcast: async () => ({ hash, operations: [] }) })),
    ]);
    const prepared = await store.dispatch(prepareSend(ethereum, request));
    await store.dispatch(broadcastSend(prepared, { payload: null }));
    expect(store.getState().accountPendingOperations).toEqual({});
  });
});
