import { getCryptoCurrencyById } from "../../currencies";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import { formatPerpsDepositAmount, resolvePerpsDepositAmountCurrency } from "./formatDepositAmount";
import type { PerpsDepositAmount } from "./server";

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: jest.fn().mockReturnValue({
    findTokenById: jest.fn().mockResolvedValue(undefined),
  }),
}));

const mockAccount = createFixtureAccount("eth", getCryptoCurrencyById("ethereum"));

describe("formatPerpsDepositAmount", () => {
  it("should format display-unit amounts using amount.currencyId", async () => {
    const amount: PerpsDepositAmount = {
      value: "1",
      currencyId: "ethereum",
    };

    await expect(formatPerpsDepositAmount(amount, mockAccount)).resolves.toMatch(
      /^1[\s\u00A0]ETH$/,
    );
  });

  it("should return an empty string when amount value is missing", async () => {
    const amount: PerpsDepositAmount = {
      value: "",
      currencyId: "ethereum",
    };

    await expect(formatPerpsDepositAmount(amount, mockAccount)).resolves.toBe("");
  });

  it("should resolve currency from amount.currencyId before falling back to account currency", async () => {
    const amount: PerpsDepositAmount = {
      value: "1",
      currencyId: "ethereum",
    };

    await expect(resolvePerpsDepositAmountCurrency(amount, mockAccount)).resolves.toBe(
      mockAccount.currency,
    );
  });
});
