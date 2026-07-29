import { getSwapTransactionStatusSectionItems } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useTranslation } from "~/context/Locale";

const TRANSLATION_PREFIX = "transfer.swap2.modals.transactionStatus";

type UseStatusSectionViewModelProps = Readonly<{
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  sendStatus: TransactionStatusValue;
  receiveStatus: TransactionStatusValue;
}>;

export function useStatusSectionViewModel({
  sendCurrency,
  receiveCurrency,
  sendStatus,
  receiveStatus,
}: UseStatusSectionViewModelProps) {
  const { t } = useTranslation();
  const statusItems = getSwapTransactionStatusSectionItems({
    sendStatus,
    receiveStatus,
    sendTicker: sendCurrency?.ticker,
    receiveTicker: receiveCurrency?.ticker,
    translationPrefix: TRANSLATION_PREFIX,
  });

  return {
    heading: t(`${TRANSLATION_PREFIX}.sections.status.heading`),
    estimatedLabel: t(`${TRANSLATION_PREFIX}.sections.status.estimated`),
    sendRow: {
      status: statusItems.send.displayStatus,
      title: t(statusItems.send.titleKey, statusItems.send.titleValues),
      subtitle: t(statusItems.send.labelKey),
      lineStatus: statusItems.receive.displayStatus,
    },
    receiveRow: {
      status: statusItems.receive.displayStatus,
      title: t(statusItems.receive.titleKey, statusItems.receive.titleValues),
      subtitle: t(statusItems.receive.labelKey),
    },
  };
}
