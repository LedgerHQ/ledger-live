import { computeAccountUUID } from "@domain/entity-account/schema.mock";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  REDACTED_ACCOUNT_CONTEXT,
  redactAccountContextAction,
  redactAccountContextState,
} from "./redaction";
import { accountContextReceived, accountContextSlice, legacyAccountContextsSynced } from "./slice";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const viewKey = "AViewKey1test";

describe("redactAccountContextAction", () => {
  it("replaces the view key of accountContextReceived", () => {
    const action = accountContextReceived({ accountUUID, context: { viewKey } });
    expect(redactAccountContextAction(action).payload.context).toEqual({
      viewKey: REDACTED_ACCOUNT_CONTEXT,
    });
  });

  it("replaces each view key of legacyAccountContextsSynced", () => {
    const action = legacyAccountContextsSynced({
      contexts: [{ accountUUID, context: { viewKey } }],
      removed: [],
    });
    expect(redactAccountContextAction(action).payload.contexts[0].context).toEqual({
      viewKey: REDACTED_ACCOUNT_CONTEXT,
    });
  });

  it("leaves unrelated actions alone", () => {
    const action = { type: "other", payload: { viewKey } };
    expect(redactAccountContextAction(action)).toBe(action);
  });
});

describe("redactAccountContextState", () => {
  it("replaces each account context field in the root state", () => {
    const state = {
      [accountContextSlice.reducerPath]: { [accountUUID]: { viewKey } },
      accounts: [],
    };
    expect(redactAccountContextState(state)).toEqual({
      [accountContextSlice.reducerPath]: {
        [accountUUID]: { viewKey: REDACTED_ACCOUNT_CONTEXT },
      },
      accounts: [],
    });
  });
});
