import { genAccount } from "@ledgerhq/coin-framework/lib/mocks/account";
import { useNetworkAccountCounts } from "../useNetworkAccountCounts";
import { createFixtureCryptoCurrency } from "../../../mock/fixtures/cryptoCurrencies";

const ethereumCurrency = createFixtureCryptoCurrency("ethereum");
const ethereumAccountHigh = genAccount("ethereum-account-high", {
  currency: ethereumCurrency,
});

describe("useNetworkAccountCounts", () => {
  it("should return the count for one account", () => {
    const assetAccountCounts = useNetworkAccountCounts({
      networks: [ethereumCurrency],
      nestedAccounts: [ethereumAccountHigh],
      formatLabel: (count: number) => `${count}`,
    });

    expect(assetAccountCounts[0].count).toBe(1);
    expect(assetAccountCounts[0].label).toBe("1");
  });

  it("should return the count for two accounts on ethereum", () => {
    const ethereumAccountLow = genAccount("ethereum-account-low", {
      currency: ethereumCurrency,
    });
    const assetAccountCounts = useNetworkAccountCounts({
      networks: [ethereumCurrency],
      nestedAccounts: [ethereumAccountHigh, ethereumAccountLow],
      formatLabel: (count: number) => `${count}`,
    });

    expect(assetAccountCounts[0].count).toBe(2);
    expect(assetAccountCounts[0].label).toBe("2");
  });
});
