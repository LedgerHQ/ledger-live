import { computeAccountUUID, type AccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { initialAccountContextState, type AccountContextState } from "./schema";
import { mockAccountContext } from "./schema.mock";
import reducer, {
  accountContextReceived,
  accountContextRemoved,
  accountContextSlice,
  selectAccountContext,
} from "./slice";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const otherAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ key: "0x0000000000000000000000000000000000000001" }),
);
const context = mockAccountContext();
const root = (state: AccountContextState) => ({ [accountContextSlice.reducerPath]: state });

describe("accountContextSlice", () => {
  it("should start empty", () => {
    expect(reducer(undefined, { type: "init" })).toEqual(initialAccountContextState);
  });

  it("should keep the context of one account", () => {
    const state = reducer(undefined, accountContextReceived({ accountUUID, context }));
    expect(selectAccountContext(root(state), accountUUID)).toEqual(context);
    expect(selectAccountContext(root(state), otherAccountUUID)).toBeUndefined();
  });

  it("should merge a later context into the stored one", () => {
    const first = reducer(undefined, accountContextReceived({ accountUUID, context }));
    const state = reducer(first, accountContextReceived({ accountUUID, context: {} }));
    expect(selectAccountContext(root(state), accountUUID)).toEqual(context);
  });

  it("should forget a removed account", () => {
    const stored = reducer(undefined, accountContextReceived({ accountUUID, context }));
    expect(reducer(stored, accountContextRemoved(accountUUID))).toEqual({});
  });

  it("should ignore a key inherited from Object.prototype", () => {
    const inherited = "toString" as AccountUUID;
    const state = reducer(undefined, accountContextReceived({ accountUUID: inherited, context }));
    expect(state).toEqual({});
    expect(selectAccountContext(root(state), inherited)).toBeUndefined();
  });
});
