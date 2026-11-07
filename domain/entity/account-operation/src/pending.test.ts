import {
  AccountDataSourceIdSchema,
  accountDataQueryKey,
  accountDataReceived,
} from "@domain/entity-account-data";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountOperation } from "./schema.mock";
import { mockAccountOperationsEntry } from "./slice.mock";
import {
  accountPendingOperationsSlice,
  pendingOperationsAdded,
  selectAccountOperationsWithPending,
  type AccountPendingOperationsState,
} from "./pending";
import type { AccountOperation } from "./schema";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const sent = mockAccountOperation({ id: "op-sent", hash: "0xsent", blockHeight: null });
const read1 = mockAccountOperation({ id: "op-1", hash: "0x1" });

const reduce = (...actions: Parameters<typeof accountPendingOperationsSlice.reducer>[1][]) =>
  actions.reduce<AccountPendingOperationsState>(accountPendingOperationsSlice.reducer, {});

const received = (operations: AccountOperation[]) =>
  accountDataReceived({
    kind: "operations",
    accountUUID,
    queryKey: accountDataQueryKey(undefined),
    requestId: "r",
    data: { operations },
    sourceId: AccountDataSourceIdSchema.parse("s"),
    append: false,
    readAt: 0,
    revision: 0,
  });

describe("accountPendingOperationsSlice", () => {
  it("should keep a sent operation across reads until one lists its hash", () => {
    const added = pendingOperationsAdded({ accountUUID, operations: [sent] });
    expect(reduce(added, added, received([read1]))[accountUUID]).toEqual([sent]);
    const confirmed = mockAccountOperation({ id: "op-sent", hash: "0xsent", blockHeight: 10 });
    expect(reduce(added, received([confirmed, read1]))[accountUUID]).toBeUndefined();
  });

  it("should head the operations read with the ones no read lists yet", () => {
    const pending = reduce(pendingOperationsAdded({ accountUUID, operations: [sent] }));
    const accountOperations = { [accountUUID]: mockAccountOperationsEntry([read1]) };
    const state = { accountOperations, accountPendingOperations: pending };
    expect(selectAccountOperationsWithPending(state, accountUUID)).toEqual([sent, read1]);
    const none = { accountOperations, accountPendingOperations: {} };
    expect(selectAccountOperationsWithPending(none, accountUUID)).toEqual([read1]);
  });

  it("should head a filtered window with the sent operations of its asset only", () => {
    const token = mockAccountOperation({ id: "op-token", hash: "0xtoken", assetId: "usdc" });
    const query = { filterAsset: token.assetId };
    const pending = reduce(pendingOperationsAdded({ accountUUID, operations: [sent] }));
    const state = {
      accountOperations: { [accountUUID]: mockAccountOperationsEntry([token], query) },
      accountPendingOperations: pending,
    };
    expect(selectAccountOperationsWithPending(state, accountUUID, query)).toEqual([token]);
  });
});
