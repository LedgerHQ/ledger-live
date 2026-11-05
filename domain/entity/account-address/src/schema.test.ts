import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountAddressSchema,
  AccountAddressesStateSchema,
  initialAccountAddressesState,
} from "./schema";
import { mockAccountAddress } from "./schema.mock";

describe("AccountAddressSchema", () => {
  it("should accept a fresh address", () => {
    expect(AccountAddressSchema.parse(mockAccountAddress())).toEqual(mockAccountAddress());
  });

  it("should reject an empty fresh address", () => {
    expect(AccountAddressSchema.safeParse({ freshAddress: "" }).success).toBe(false);
  });
});

describe("AccountAddressesStateSchema", () => {
  const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());

  it("should accept an empty initial state", () => {
    expect(AccountAddressesStateSchema.parse(initialAccountAddressesState)).toEqual({});
  });

  it("should accept an address keyed by an AccountUUID", () => {
    const stored = { [accountUUID]: mockAccountAddress() };
    expect(AccountAddressesStateSchema.parse(stored)).toEqual(stored);
  });

  it("should reject a key that is not an AccountUUID", () => {
    expect(AccountAddressesStateSchema.safeParse({ nope: mockAccountAddress() }).success).toBe(
      false,
    );
  });
});
