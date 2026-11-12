import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountReceive } from "./schema.mock";
import { mockAccountReceivesState } from "./slice.mock";
import { selectAccountReceive } from "./selectors";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const missingAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const state = { accountReceives: mockAccountReceivesState() };

describe("selectAccountReceive", () => {
  it("should return the stored receive of the account", () => {
    expect(selectAccountReceive(state, accountUUID)).toEqual(mockAccountReceive());
  });

  it("should return undefined when the account has no stored receive", () => {
    expect(selectAccountReceive(state, missingAccountUUID)).toBeUndefined();
  });
});
