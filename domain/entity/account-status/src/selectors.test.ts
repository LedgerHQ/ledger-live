import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { mockAccountStatus, mockAssetStatus } from "./schema.mock";
import { mockAccountStatusState } from "./slice.mock";
import { selectAccountStatus, selectAssetStatus } from "./selectors";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const missingAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const ethereum = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const usdc = CryptoOrTokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin");
const state = { accountStatus: mockAccountStatusState() };

describe("selectAccountStatus", () => {
  it("should return the stored status of the account", () => {
    expect(selectAccountStatus(state, accountUUID)).toEqual(mockAccountStatus());
  });

  it("should return undefined when only assets of the account were read", () => {
    const assetsOnly = { accountStatus: { [accountUUID]: { assets: {} } } };
    expect(selectAccountStatus(assetsOnly, accountUUID)).toBeUndefined();
  });

  it("should return undefined when the account has no stored status", () => {
    expect(selectAccountStatus(state, missingAccountUUID)).toBeUndefined();
  });
});

describe("selectAssetStatus", () => {
  it("should return the stored status of an asset of the account", () => {
    expect(selectAssetStatus(state, accountUUID, ethereum)).toEqual(mockAssetStatus());
  });

  it("should return undefined when the asset of the account has no stored status", () => {
    expect(selectAssetStatus(state, accountUUID, usdc)).toBeUndefined();
  });

  it("should return undefined when the account has no stored status", () => {
    expect(selectAssetStatus(state, missingAccountUUID, ethereum)).toBeUndefined();
  });
});
