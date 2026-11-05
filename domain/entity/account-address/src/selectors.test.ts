import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountAddress } from "./schema.mock";
import { selectAccountAddress } from "./selectors";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const missingAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const state = { accountAddresses: { [accountUUID]: mockAccountAddress() } };

describe("selectAccountAddress", () => {
  it("should return the stored address of an account", () => {
    expect(selectAccountAddress(state, accountUUID)).toEqual(mockAccountAddress());
  });

  it("should return undefined when the account has no stored address", () => {
    expect(selectAccountAddress(state, missingAccountUUID)).toBeUndefined();
  });
});
