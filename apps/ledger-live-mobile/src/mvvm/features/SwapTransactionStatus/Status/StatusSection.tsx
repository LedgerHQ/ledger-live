import React from "react";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
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
  const statusLabel = t(`transfer.swap2.modals.transactionStatus.statusLabels.${currentStatus}`);
  const isFinished = currentStatus === "finished";

  return (
    <Box lx={{ gap: "s12" }}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {t("transfer.swap2.modals.transactionStatus.sections.status.heading")}
      </Text>
      <Box lx={{ gap: "s4", borderRadius: "md", backgroundColor: "surface", padding: "s12" }}>
        <StatusRow
          status={status}
          title={t(
            `transfer.swap2.modals.transactionStatus.sections.status.${
              isFinished ? "sendCompleted" : "sendPending"
            }`,
            { ticker: sendCurrency?.ticker ?? "" },
          )}
          subtitle={statusLabel}
          value={sentAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
        />
        <StatusRow
          status={status}
          title={t(
            `transfer.swap2.modals.transactionStatus.sections.status.${
              isFinished ? "receiveCompleted" : "receivePending"
            }`,
            { ticker: receiveCurrency?.ticker ?? "" },
          )}
          subtitle={statusLabel}
          value={receivedAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
          isLast
        />
      </Box>
    </Box>
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

