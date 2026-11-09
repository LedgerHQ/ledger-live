import {
  AccountDataSourceIdSchema,
  accountDataQueryKey,
  accountDataReceived,
} from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { mockAccountOperation } from "./schema.mock";
import { mockAccountOperationsEntry, mockAccountOperationsState } from "./slice.mock";
import {
  accountPendingOperationsSlice,
  pendingOperationsAdded,
  pendingOperationsDropped,
  selectAccountOperationsWithPending,
  type AccountPendingOperationsState,
} from "./pending";
import type { AccountOperation, AccountOperationsQuery } from "./schema";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const sent = mockAccountOperation({ id: "op-sent", hash: "0xsent", blockHeight: null });
const read1 = mockAccountOperation({ id: "op-1", hash: "0x1" });
const bitcoin = CryptoOrTokenCurrencyIdSchema.parse("bitcoin");

const reduce = (...actions: Parameters<typeof accountPendingOperationsSlice.reducer>[1][]) =>
  actions.reduce<AccountPendingOperationsState>(accountPendingOperationsSlice.reducer, {});

const received = (operations: AccountOperation[], query?: AccountOperationsQuery) =>
  accountDataReceived({
    kind: "operations",
    accountUUID,
    queryKey: accountDataQueryKey(query),
    requestId: "r",
    data: { operations },
    sourceId: AccountDataSourceIdSchema.parse("s"),
    append: false,
    readAt: 0,
    revision: 0,
  });

const stateOf = (read: AccountOperation[], pending: AccountPendingOperationsState) => ({
  accountOperations: mockAccountOperationsState({ [accountUUID]: read }),
  accountPendingOperations: pending,
});

describe("accountPendingOperationsSlice", () => {
  it("should keep a sent operation across reads until one lists its hash", () => {
    const added = pendingOperationsAdded({ accountUUID, operations: [sent] });
    expect(reduce(added, added, received([read1]))[accountUUID]).toEqual([sent]);
    const confirmed = mockAccountOperation({ id: "op-sent", hash: "0xsent", blockHeight: 10 });
    expect(reduce(added, received([confirmed, read1]))[accountUUID]).toBeUndefined();
  });

  it("should head the operations read with the ones no read lists yet", () => {
    const state = stateOf(
      [read1],
      reduce(pendingOperationsAdded({ accountUUID, operations: [sent] })),
    );
    expect(selectAccountOperationsWithPending(state, accountUUID)).toEqual([sent, read1]);
    const none = stateOf([read1], {});
    expect(selectAccountOperationsWithPending(none, accountUUID)).toEqual([read1]);
  });

  it("should not show a sent operation twice when a read listed it before it was added", () => {
    const listed = mockAccountOperation({ id: "op-sent", hash: "0xsent", blockHeight: 10 });
    const pending = reduce(
      received([listed, read1]),
      pendingOperationsAdded({ accountUUID, operations: [sent] }),
    );
    expect(
      selectAccountOperationsWithPending(stateOf([listed, read1], pending), accountUUID),
    ).toEqual([listed, read1]);
  });

  it("should only head a filtered window with the sent operations of its asset", () => {
    const pending = reduce(pendingOperationsAdded({ accountUUID, operations: [sent] }));
    const state = {
      accountOperations: {
        [accountUUID]: mockAccountOperationsEntry([read1], { filterAsset: bitcoin }),
      },
      accountPendingOperations: pending,
    };
    expect(
      selectAccountOperationsWithPending(state, accountUUID, { filterAsset: bitcoin }),
    ).toEqual([read1]);
  });

  it("should stay unloaded while the window is not read yet, sent operations or not", () => {
    const pending = reduce(pendingOperationsAdded({ accountUUID, operations: [sent] }));
    const unread = { accountOperations: {}, accountPendingOperations: pending };
    expect(selectAccountOperationsWithPending(unread, accountUUID)).toBeUndefined();
  });

  it("should drop the sent operations no read will list, or all of a removed account", () => {
    const other = mockAccountOperation({ id: "op-other", hash: "0xother", blockHeight: null });
    const added = pendingOperationsAdded({ accountUUID, operations: [sent, other] });
    expect(
      reduce(added, pendingOperationsDropped({ accountUUID, hashes: ["0xsent"] }))[accountUUID],
    ).toEqual([other]);
    expect(reduce(added, pendingOperationsDropped({ accountUUID }))).toEqual({});
  });

  it("should keep a token transfer's pending row when a read lists only its fee, sharing the hash", () => {
    const usdc = CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin");
    const tokenRow = mockAccountOperation({
      id: "op-token",
      hash: "0xsent",
      assetId: usdc,
      blockHeight: null,
    });
    const feeRow = mockAccountOperation({ id: "op-fee", hash: "0xsent", type: "FEES" });
    const pending = reduce(
      pendingOperationsAdded({ accountUUID, operations: [tokenRow] }),
      received([feeRow]),
    );
    expect(pending[accountUUID]).toEqual([tokenRow]);
    const state = {
      accountOperations: {
        [accountUUID]: mockAccountOperationsEntry([read1], { filterAsset: usdc }),
      },
      accountPendingOperations: pending,
    };
    state.accountOperations[accountUUID].byId[feeRow.id] = feeRow;
    expect(selectAccountOperationsWithPending(state, accountUUID, { filterAsset: usdc })).toEqual([
      tokenRow,
      read1,
    ]);
  });

  it("should keep a sent operation that only a filtered read lists, for the windows still lacking it", () => {
    const listed = mockAccountOperation({ id: "op-sent", hash: "0xsent", blockHeight: 10 });
    const ethereum = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
    const pending = reduce(
      pendingOperationsAdded({ accountUUID, operations: [sent] }),
      received([listed], { filterAsset: ethereum }),
    );
    expect(pending[accountUUID]).toEqual([sent]);
    expect(selectAccountOperationsWithPending(stateOf([read1], pending), accountUUID)).toEqual([
      sent,
      read1,
    ]);
  });
});
