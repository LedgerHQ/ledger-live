import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { useAssetAccountCounts } from "../useAssetAccountCounts";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";

const ethereumCurrency = createFixtureCryptoCurrency("ethereum");
const ethereumAccountHigh = genAccount("ethereum-account-high", {
  currency: ethereumCurrency,
});

describe("useAssetAccountCounts", () => {
  it("should return the count for one account", () => {
    const assetAccountCounts = useAssetAccountCounts({
      assets: [ethereumCurrency],
      nestedAccounts: [ethereumAccountHigh],
      accountIds: new Map([[ethereumAccountHigh.id, true]]),
      formatLabel: (count: number) => `${count}`,
    });

    expect(assetAccountCounts[0].count).toBe(1);
    expect(assetAccountCounts[0].label).toBe("1");
  });

  it("should return the count for two accounts on ethereum", () => {
    const ethereumAccountLow = genAccount("ethereum-account-low", {
      currency: ethereumCurrency,
    });
    const assetAccountCounts = useAssetAccountCounts({
      assets: [ethereumCurrency],
      nestedAccounts: [ethereumAccountHigh, ethereumAccountLow],
      accountIds: new Map([
        [ethereumAccountHigh.id, true],
        [ethereumAccountLow.id, true],
      ]),
      formatLabel: (count: number) => `${count}`,
    });

    expect(assetAccountCounts[0].count).toBe(2);
    expect(assetAccountCounts[0].label).toBe("2");
  });
});
