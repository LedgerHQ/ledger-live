import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { mockAccountReceive } from "./schema.mock";
import { mockAccountReceivesState } from "./slice.mock";
import { selectAccountReceive } from "./selectors";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const missingAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const ethereum = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const usdc = CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin");
const state = { accountReceives: mockAccountReceivesState() };

describe("selectAccountReceive", () => {
  it("should return the stored receive of an asset of the account", () => {
    expect(selectAccountReceive(state, accountUUID, ethereum)).toEqual(mockAccountReceive());
  });

  it("should return undefined when the asset of the account has no stored receive", () => {
    expect(selectAccountReceive(state, accountUUID, usdc)).toBeUndefined();
  });

  it("should return undefined when the account has no stored receive", () => {
    expect(selectAccountReceive(state, missingAccountUUID, ethereum)).toBeUndefined();
  });
});
