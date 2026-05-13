import React from "react";
import { useTranslation } from "react-i18next";
import { getSwapTransactionStatusSectionItems } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { StatusRow } from "./StatusRow";

const TRANSACTION_STATUS_TRANSLATION_PREFIX = "swap2.modals.transactionStatus";

type StatusSectionProps = Readonly<{
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  sendStatus: TransactionStatusValue;
  receiveStatus: TransactionStatusValue;
  sentAmount?: string;
  receivedAmount?: string;
  isLoading: boolean;
}>;

export function StatusSection({
  sendCurrency,
  receiveCurrency,
  sendStatus,
  receiveStatus,
  sentAmount,
  receivedAmount,
  isLoading,
}: StatusSectionProps) {
  const { t } = useTranslation();
  const statusItems = getSwapTransactionStatusSectionItems({
    sendStatus,
    receiveStatus,
    sendTicker: sendCurrency?.ticker,
    receiveTicker: receiveCurrency?.ticker,
    translationPrefix: TRANSACTION_STATUS_TRANSLATION_PREFIX,
  });

  return (
    <section className="flex flex-col">
      <h3 className="mb-12 heading-5-semi-bold text-base">
        {t("swap2.modals.transactionStatus.sections.status.heading")}
      </h3>
      <div className="flex flex-col rounded-md bg-surface p-12 pb-8 gap-12">
        <StatusRow
          status={statusItems.send.displayStatus}
          title={t(statusItems.send.titleKey, statusItems.send.titleValues)}
          subtitle={t(statusItems.send.labelKey)}
          value={sentAmount ?? <Skeleton className="h-16 w-96 rounded-sm" />}
          isLoading={isLoading}
          lineStatus={statusItems.receive.displayStatus}
          testId="swap-transaction-status-send"
        />
        <StatusRow
          status={statusItems.receive.displayStatus}
          title={t(statusItems.receive.titleKey, statusItems.receive.titleValues)}
          subtitle={t(statusItems.receive.labelKey)}
          value={receivedAmount ?? <Skeleton className="h-16 w-96 rounded-sm" />}
          isLoading={isLoading}
          testId="swap-transaction-status-receive"
        />
      </div>
    </section>
  );
}
