import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountEntrySchema,
  AccountsStateSchema,
  LegacyAccountEntrySchema,
  initialAccountsState,
} from "./schema";
import { mockAccountEntry } from "./schema.mock";

describe("AccountEntrySchema", () => {
  it("accepts a mock, with or without a legacy account id", () => {
    expect(AccountEntrySchema.parse(mockAccountEntry())).toEqual(mockAccountEntry());
    expect(AccountEntrySchema.safeParse(mockAccountEntry({ legacyId: undefined })).success).toBe(
      true,
    );
  });

  it("rejects an entry without a valid AccountUUID or legacy id", () => {
    expect(
      AccountEntrySchema.safeParse({ ...mockAccountEntry(), accountUUID: "nope" }).success,
    ).toBe(false);
    expect(AccountEntrySchema.safeParse({ ...mockAccountEntry(), legacyId: "a+b" }).success).toBe(
      false,
    );
  });

  it("requires the legacy id on a legacy entry", () => {
    expect(
      LegacyAccountEntrySchema.safeParse(mockAccountEntry({ legacyId: undefined })).success,
    ).toBe(false);
  });
});

describe("mockAccountEntry", () => {
  it("keys the entry by the AccountUUID of an overridden descriptor", () => {
    const entry = mockAccountEntry({ descriptor: mockUtxoAccountDescriptor() });
    expect(entry.accountUUID).not.toBe(mockAccountEntry().accountUUID);
  });
});

describe("AccountsStateSchema", () => {
  it("accepts the initial state and a state keyed by AccountUUID", () => {
    expect(AccountsStateSchema.parse(initialAccountsState)).toEqual({
      ids: [],
      entities: {},
      byLegacyId: {},
    });
    const entry = mockAccountEntry();
    const state = (key: string) => ({
      ids: [entry.accountUUID],
      entities: { [key]: entry },
      byLegacyId: { [entry.legacyId ?? ""]: entry.accountUUID },
    });
    expect(AccountsStateSchema.safeParse(state(entry.accountUUID)).success).toBe(true);
    expect(AccountsStateSchema.safeParse(state("nope")).success).toBe(false);
  });
});
