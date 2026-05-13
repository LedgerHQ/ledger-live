import React from "react";
import { useTranslation } from "react-i18next";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { StatusRow } from "./StatusRow";

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
  const sendDisplayStatus = getDisplayStatus(sendStatus);
  const receiveDisplayStatus = getDisplayStatus(receiveStatus);
  const sendStatusLabel = t(getStatusLabelKey("send", sendStatus));
  const receiveStatusLabel = t(getStatusLabelKey("receive", receiveStatus));
  const sendTitle = t(getStatusTitleKey("send", sendStatus), {
    ticker: sendCurrency?.ticker ?? "",
  });
  const receiveTitle = t(getStatusTitleKey("receive", receiveStatus), {
    ticker: receiveCurrency?.ticker ?? "",
  });

  return (
    <section className="flex flex-col">
      <h3 className="mb-12 heading-5-semi-bold text-base">
        {t("swap2.modals.transactionStatus.sections.status.heading")}
      </h3>
      <div className="flex flex-col rounded-md bg-surface p-12 pb-8 gap-12">
        <StatusRow
          status={sendDisplayStatus}
          title={sendTitle}
          subtitle={sendStatusLabel}
          value={sentAmount ?? <Skeleton className="h-16 w-96 rounded-sm" />}
          isLoading={isLoading}
          lineStatus={receiveDisplayStatus}
        />
        <StatusRow
          status={receiveDisplayStatus}
          title={receiveTitle}
          subtitle={receiveStatusLabel}
          value={receivedAmount ?? <Skeleton className="h-16 w-96 rounded-sm" />}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}

function getStatusTitleKey(direction: "send" | "receive", currentStatus: TransactionStatusValue) {
  if (direction === "send" && currentStatus === "finished") {
    return "swap2.modals.transactionStatus.sections.status.sendCompleted";
  }
  if (direction === "send") {
    return "swap2.modals.transactionStatus.sections.status.sendPending";
  }
  if (currentStatus === "finished") {
    return "swap2.modals.transactionStatus.sections.status.receiveCompleted";
  }
  return "swap2.modals.transactionStatus.sections.status.receivePending";
}

function getStatusLabelKey(direction: "send" | "receive", currentStatus: TransactionStatusValue) {
  if (direction === "receive" && currentStatus === "refunded") {
    return "swap2.modals.transactionStatus.statusLabels.cancelled";
  }
  return `swap2.modals.transactionStatus.statusLabels.${currentStatus}`;
}

function getDisplayStatus(
  currentStatus: TransactionStatusValue,
): "success" | "pending" | "error" | "unknown" {
  switch (currentStatus) {
    case "finished":
      return "success";
    case "expired":
    case "refunded":
      return "error";
    case "unknown":
      return "unknown";
    default:
      return "pending";
  }
}
