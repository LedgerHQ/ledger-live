import React from "react";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { StatusRow } from "./StatusRow";

type StatusSectionProps = {
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  sendStatus: TransactionStatusValue;
  receiveStatus: TransactionStatusValue;
  sentAmount?: string;
  receivedAmount?: string;
  isLoading: boolean;
};

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
    <Box lx={{ gap: "s12" }}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {t("transfer.swap2.modals.transactionStatus.sections.status.heading")}
      </Text>
      <Box lx={{ gap: "s4", borderRadius: "md", backgroundColor: "surface", padding: "s12" }}>
        <StatusRow
          status={sendDisplayStatus}
          title={sendTitle}
          subtitle={sendStatusLabel}
          value={sentAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
          isLoading={isLoading}
          lineStatus={receiveDisplayStatus}
        />
        <StatusRow
          status={receiveDisplayStatus}
          title={receiveTitle}
          subtitle={receiveStatusLabel}
          value={receivedAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
          isLoading={isLoading}
          isLast
        />
      </Box>
    </Box>
  );
}

function getStatusTitleKey(direction: "send" | "receive", currentStatus: TransactionStatusValue) {
  if (direction === "send" && currentStatus === "finished") {
    return "transfer.swap2.modals.transactionStatus.sections.status.sendCompleted";
  }
  if (direction === "send") {
    return "transfer.swap2.modals.transactionStatus.sections.status.sendPending";
  }
  if (currentStatus === "finished") {
    return "transfer.swap2.modals.transactionStatus.sections.status.receiveCompleted";
  }
  return "transfer.swap2.modals.transactionStatus.sections.status.receivePending";
}

function getStatusLabelKey(direction: "send" | "receive", currentStatus: TransactionStatusValue) {
  if (direction === "receive" && currentStatus === "refunded") {
    return "transfer.swap2.modals.transactionStatus.statusLabels.cancelled";
  }
  return `transfer.swap2.modals.transactionStatus.statusLabels.${currentStatus}`;
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
