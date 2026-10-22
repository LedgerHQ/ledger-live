import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountAssetBalance } from "./schema.mock";
import { selectAccountAssetBalance, selectAccountBalances } from "./selectors";

const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
const missingAccountUUID = computeAccountUUID(
  mockAddressAccountDescriptor({ address: "0x0000000000000000000000000000000000000001" }),
);
const eth = mockAccountAssetBalance();
const usdt = mockAccountAssetBalance({
  assetId: "ethereum/erc20/usd-tether",
  balance: "5",
  spendableBalance: "5",
});
const state = { accountBalances: { [accountUUID]: [eth, usdt] } };

describe("selectAccountBalances", () => {
  it("should return every row stored for an account", () => {
    expect(selectAccountBalances(state, accountUUID)).toEqual([eth, usdt]);
  });

  it("should return undefined when the account has no stored rows", () => {
    expect(selectAccountBalances(state, missingAccountUUID)).toBeUndefined();
  });
});

describe("selectAccountAssetBalance", () => {
  it("should return the native coin row", () => {
    expect(selectAccountAssetBalance(state, accountUUID, eth.assetId)).toEqual(eth);
  });

  it("should return the token row", () => {
    expect(selectAccountAssetBalance(state, accountUUID, usdt.assetId)).toEqual(usdt);
  });

  it("should return undefined when the account does not hold the asset", () => {
    const bitcoin = mockAccountAssetBalance({ assetId: "bitcoin" }).assetId;
    expect(selectAccountAssetBalance(state, accountUUID, bitcoin)).toBeUndefined();
  });

  it("should return undefined when the account has no stored rows", () => {
    expect(selectAccountAssetBalance(state, missingAccountUUID, eth.assetId)).toBeUndefined();
  });
});
