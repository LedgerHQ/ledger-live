import type { PayGlobalProperties } from "./types";

const PAY_STABLECOIN_TICKERS = new Set(["DAI", "EURC", "PYUSD", "USDC", "USDS", "USDT"]);

export type PayGlobalPropertiesSource = Readonly<{
  featureFlagPay: boolean;
  hasCard: boolean;
  isSignedIn: boolean;
  accountTickers: readonly string[];
  internalWalletBalances?: readonly string[];
  cardStatus?: Readonly<{ cardAddedToDigitalWallet?: boolean }>;
  hasCardTransactions?: boolean;
  cardWallets?: readonly Readonly<{ priority: number; currency: string }>[];
  cashback?: Readonly<{ amount: string; currency?: string | null }>;
}>;

function countHeldStablecoins(tickers: readonly string[]): number {
  return tickers.filter(ticker => PAY_STABLECOIN_TICKERS.has(ticker.toUpperCase())).length;
}

export function toPayGlobalProperties({
  featureFlagPay,
  hasCard,
  isSignedIn,
  accountTickers,
  internalWalletBalances,
  cardStatus,
  hasCardTransactions,
  cardWallets,
  cashback,
}: PayGlobalPropertiesSource): PayGlobalProperties {
  if (!featureFlagPay) {
    return { featureFlagPay: false };
  }

  const properties: PayGlobalProperties = {
    featureFlagPay: true,
    hasStable: countHeldStablecoins(accountTickers) > 0,
    hasCard,
    cardLoggedIn: isSignedIn,
  };

  if (internalWalletBalances !== undefined) {
    properties.hasFundsOnCard = internalWalletBalances.some(balance => Number(balance) > 0);
  }

  if (hasCardTransactions !== undefined) {
    properties.has_tx = hasCardTransactions;
  }

  if (cardStatus !== undefined) {
    properties.cardAddedToOsWallet = cardStatus.cardAddedToDigitalWallet ?? false;
  }

  if (cardWallets !== undefined) {
    properties.cardDebitOrder = [...cardWallets]
      .sort((a, b) => a.priority - b.priority)
      .map(wallet => wallet.currency.toUpperCase());
  }

  if (cashback !== undefined) {
    properties.cardRewardsAvailable = Number(cashback.amount ?? 0) > 0;
    properties.cardRewardCurrency = cashback.currency ?? null;
  }

  return properties;
}
