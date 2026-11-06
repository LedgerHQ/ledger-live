import { mockUsdcAssetsData } from "@domain/api-aggregated-assets/mock";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { buildMultiCV } from "@domain/entity-market-countervalues/mock";
import type {
  AnalyticsAccountSource,
  AnalyticsAmount,
  AnalyticsPositionSource,
  AnalyticsTokenAccountSource,
} from "./types";
import { getAnalyticsPositionCurrency } from "./logic/analyticsPositionSource";

export type MockOperation = Readonly<{ isConfirmed: boolean }>;
export type MockAccount = AnalyticsAccountSource<MockOperation>;
export type MockTokenAccount = AnalyticsTokenAccountSource<MockOperation>;

export const analyticsFiat = getFiatCurrencyByTicker("USD");
export const usdcToken = mockUsdcAssetsData.cryptoOrTokenCurrencies["ethereum/erc20/usd_coin"];
export const confirmedOperation: MockOperation = { isConfirmed: true };
export const pendingOperation: MockOperation = { isConfirmed: false };

export function mockAmount(value: number): AnalyticsAmount {
  return { isZero: () => value === 0, toNumber: () => value };
}

function unitsOf(currency: CryptoOrTokenCurrency, amount: number): AnalyticsAmount {
  return mockAmount(amount * 10 ** currency.units[0].magnitude);
}

export function createMockAccount(id: string, currencyId = "ethereum", amount = 1): MockAccount {
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

export function createMockToken(parent: MockAccount, amount = 10): MockTokenAccount {
  return {
    type: "TokenAccount",
    id: `${parent.id}+usdc`,
    parentId: parent.id,
    token: usdcToken,
    balance: unitsOf(usdcToken, amount),
    operations: [confirmedOperation],
  };
}

/** Natives are priced 200 and tokens 1, with a flat 401-day history. */
export function createMockCountervalues(positions: readonly AnalyticsPositionSource[]) {
  return buildMultiCV(
    positions.map(position => {
      const isToken = position.type === "TokenAccount";
      const history = Object.fromEntries(
        Array.from({ length: 401 }, (_, index) => [
          new Date(Date.now() - index * 86400000).toISOString().slice(0, 10),
          isToken ? 1 : 100,
        ]),
      );
      return {
        pair: { from: getAnalyticsPositionCurrency(position), to: analyticsFiat },
        history,
        latest: isToken ? 1 : 200,
      };
    }),
  );
}
