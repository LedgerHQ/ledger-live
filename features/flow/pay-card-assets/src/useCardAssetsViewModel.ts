import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn } from "@features/flow-pay-card-auth";
import { useCardLinkedWallets } from "@features/flow-pay-card-wallets";
import type {
  CardAssetFormattedValue,
  CardAssetRow,
  CardAssetsProps,
  CardAssetsStatus,
  CardAssetsViewModel,
  FormatCardAssetCountervalue,
} from "./types";

const KEY_PREFIX = "payTab.card.assets";

const CARD_ASSET_NAMES: Readonly<Record<string, string>> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  XRP: "XRP",
  LTC: "Litecoin",
  USDC: "USD Coin",
  USDT: "Tether",
};

const NO_COUNTER_VALUE = () => null;

export function formatCardAssetTicker(currency: string): string {
  return currency.toUpperCase();
}

export function formatCardAssetName(currency: string): string {
  const ticker = formatCardAssetTicker(currency);
  return CARD_ASSET_NAMES[ticker] ?? ticker;
}

export function formatCardAssetCryptoAmount(
  balance: string | null,
  currency: string,
): string | null {
  return balance === null ? null : `${balance} ${formatCardAssetTicker(currency)}`;
}

export function formatCardAssetFiatAmount(
  counterValue: number | null,
  formatCountervalue?: FormatCardAssetCountervalue,
): string | null {
  if (counterValue === null || formatCountervalue === undefined) {
    return null;
  }
  return stringifyFormattedValue(formatCountervalue(counterValue));
}

function stringifyFormattedValue({
  integerPart,
  decimalPart,
  currencyText,
  decimalSeparator,
  currencyPosition,
}: CardAssetFormattedValue): string {
  const amount = decimalPart ? `${integerPart}${decimalSeparator}${decimalPart}` : integerPart;
  return currencyPosition === "start" ? `${currencyText}${amount}` : `${amount}${currencyText}`;
}

export function useCardAssetsViewModel({
  formatCountervalue,
  resolveCounterValue = NO_COUNTER_VALUE,
}: CardAssetsProps = {}): CardAssetsViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const { wallets, isLoading, isError } = useCardLinkedWallets({
    resolveCounterValue,
    skip: !isSignedIn,
  });

  const rows = useMemo<readonly CardAssetRow[]>(
    () =>
      wallets.map(({ id, balance, currency, counterValue, ledgerId }) => ({
        id,
        name: formatCardAssetName(currency),
        ticker: formatCardAssetTicker(currency),
        cryptoAmount: formatCardAssetCryptoAmount(balance, currency),
        fiatAmount: formatCardAssetFiatAmount(counterValue, formatCountervalue),
        ledgerId,
      })),
    [wallets, formatCountervalue],
  );

  const status = useMemo<CardAssetsStatus>(() => {
    if (isLoading) return "loading";
    if (isError) return "error";
    if (rows.length === 0) return "empty";
    return "ready";
  }, [isLoading, isError, rows.length]);

  return useMemo(
    () => ({
      isVisible: isSignedIn,
      title: t(`${KEY_PREFIX}.title`),
      status,
      rows,
      emptyLabel: t(`${KEY_PREFIX}.empty`),
      errorLabel: t(`${KEY_PREFIX}.error`),
    }),
    [isSignedIn, t, status, rows],
  );
}
