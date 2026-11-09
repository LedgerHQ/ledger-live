import { mockUsdcAssetsData } from "@domain/api-aggregated-assets/mock";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AnalyticsAccountSource, AnalyticsAmount, AnalyticsTokenAccountSource } from "./types";

export type MockOperation = Readonly<{ isConfirmed: boolean }>;
export type MockAccount = AnalyticsAccountSource<MockOperation>;
export type MockTokenAccount = AnalyticsTokenAccountSource<MockOperation>;

export const usdcToken = mockUsdcAssetsData.cryptoOrTokenCurrencies["ethereum/erc20/usd_coin"];
export const confirmedOperation: MockOperation = { isConfirmed: true };
export const pendingOperation: MockOperation = { isConfirmed: false };

export function mockAmount(value: number): AnalyticsAmount {
  return { isZero: () => value === 0, toNumber: () => value };
}

function unitsOf(currency: CryptoOrTokenCurrency, amount: number): AnalyticsAmount {
  return mockAmount(amount * 10 ** currency.units[0].magnitude);
}

export function createAnalyticsAccount(
  id: string,
  currencyId = "ethereum",
  amount = 1,
): MockAccount {
  const currency = getCryptoCurrencyById(currencyId);
  return {
    type: "Account",
    id,
    currency,
    freshAddress: `address-${id}`,
    balance: unitsOf(currency, amount),
    operations: [confirmedOperation],
  };
}

export function createAnalyticsToken(parent: MockAccount, amount = 10): MockTokenAccount {
  return {
    type: "TokenAccount",
    id: `${parent.id}+usdc`,
    parentId: parent.id,
    token: usdcToken,
    balance: unitsOf(usdcToken, amount),
    operations: [confirmedOperation],
  };
}
