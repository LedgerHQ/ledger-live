import React from "react";
import { useTranslation } from "react-i18next";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { StatusRow } from "./StatusRow";

type StatusSectionProps = {
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  currentStatus: TransactionStatusValue;
  sentAmount?: string;
  receivedAmount?: string;
};

export function StatusSection({
  sendCurrency,
  receiveCurrency,
  currentStatus,
  sentAmount,
  receivedAmount,
}: StatusSectionProps) {
  const { t } = useTranslation();
  const status = getDisplayStatus(currentStatus);
  const statusLabel = t(`swap2.modals.transactionStatus.statusLabels.${currentStatus}`);
  const isFinished = currentStatus === "finished";

  return (
    <section className="flex flex-col">
      <h3 className="mb-12 heading-5-semi-bold text-base">
        {t("swap2.modals.transactionStatus.sections.status.heading")}
      </h3>
      <div className="flex flex-col rounded-md bg-surface p-12 gap-4">
        <StatusRow
          status={status}
          title={t(
            `swap2.modals.transactionStatus.sections.status.${
              isFinished ? "sendCompleted" : "sendPending"
            }`,
            { ticker: sendCurrency?.ticker ?? "" },
          )}
          subtitle={statusLabel}
          value={sentAmount ?? <Skeleton className="h-16 w-96 rounded-sm" />}
        />
        <StatusRow
          status={status}
          title={t(
            `swap2.modals.transactionStatus.sections.status.${
              isFinished ? "receiveCompleted" : "receivePending"
            }`,
            { ticker: receiveCurrency?.ticker ?? "" },
          )}
          subtitle={statusLabel}
          value={receivedAmount ?? <Skeleton className="h-16 w-96 rounded-sm" />}
        />
      </div>
    </section>
  );
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

