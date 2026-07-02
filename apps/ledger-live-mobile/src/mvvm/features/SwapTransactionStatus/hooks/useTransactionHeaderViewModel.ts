import { formatSwapTransactionStatusCreatedAt } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTranslation } from "~/context/Locale";

type UseTransactionHeaderViewModelProps = Readonly<{
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  createdAt?: number;
  locale: string;
}>;

export function useTransactionHeaderViewModel({
  sendCurrency,
  receiveCurrency,
  createdAt,
  locale,
}: UseTransactionHeaderViewModelProps) {
  const { t } = useTranslation();
  const title =
    sendCurrency && receiveCurrency
      ? t("transfer.swap2.modals.transactionStatus.title", {
          sendTicker: sendCurrency.ticker,
          receiveTicker: receiveCurrency.ticker,
        })
      : undefined;
  const formattedDate = createdAt
    ? formatSwapTransactionStatusCreatedAt(createdAt, locale)
    : undefined;

  return { title, formattedDate };
}
