import { formatSwapTransactionStatusCreatedAt } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { SwapTransactionStatusOrigin } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useTranslation } from "~/context/Locale";

type UseTransactionHeaderViewModelProps = Readonly<{
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  createdAt?: number;
  locale: string;
  origin?: SwapTransactionStatusOrigin;
}>;

export function useTransactionHeaderViewModel({
  sendCurrency,
  receiveCurrency,
  createdAt,
  locale,
  origin,
}: UseTransactionHeaderViewModelProps) {
  const { t } = useTranslation();
  const hasCurrencies = sendCurrency !== undefined && receiveCurrency !== undefined;
  const tickers = hasCurrencies
    ? { sendTicker: sendCurrency.ticker, receiveTicker: receiveCurrency.ticker }
    : undefined;

  const isPerps = origin === "perps";
  const title = isPerps
    ? t("perpsTransactionStatus.title")
    : tickers
      ? t("transfer.swap2.modals.transactionStatus.title", tickers)
      : undefined;
  const currencies =
    tickers && isPerps ? t("perpsTransactionStatus.currencies", tickers) : undefined;

  const formattedDate = createdAt
    ? formatSwapTransactionStatusCreatedAt(createdAt, locale)
    : undefined;

  return { title, currencies, formattedDate };
}
