import type { PayGlobalProperties } from "./types";

const PAY_STABLECOIN_TICKERS = new Set(["DAI", "EURC", "PYUSD", "USDC", "USDS", "USDT"]);

export type PayGlobalPropertiesSource = Readonly<{
  featureFlagPay: boolean;
  hasCard: boolean;
  isSignedIn: boolean;
  accountTickers: readonly string[];
  internalWalletBalances?: readonly string[];
  cardStatus?: Readonly<{ cardAddedToDigitalWallet?: boolean }>;
  cardTransactions?: readonly unknown[];
  cardWallets?: readonly Readonly<{ priority: number; currency: string }>[];
  rewardWallet?: Readonly<{ balance: string; currency: string }>;
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
  cardTransactions,
  cardWallets,
  rewardWallet,
}: PayGlobalPropertiesSource): PayGlobalProperties {
  if (!featureFlagPay) {
    return { featureFlagPay: false };
  }

  const cardDebitOrder = [...(cardWallets ?? [])]
    .sort((a, b) => a.priority - b.priority)
    .map(wallet => wallet.currency.toUpperCase());

  return {
    featureFlagPay: true,
    hasStable: countHeldStablecoins(accountTickers) > 0,
    hasCard,
    cardLoggedIn: isSignedIn,
    hasFundsOnCard: (internalWalletBalances ?? []).some(balance => Number(balance) > 0),
    has_tx: Boolean(cardTransactions?.length),
    cardAddedToOsWallet: cardStatus?.cardAddedToDigitalWallet ?? false,
    cardDebitOrder,
    cardRewardsAvailable: Number(rewardWallet?.balance ?? 0) > 0,
    cardRewardCurrency: rewardWallet?.currency ?? null,
  };
}
