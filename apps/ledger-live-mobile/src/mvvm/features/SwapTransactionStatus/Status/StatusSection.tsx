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
};

export function StatusSection({
  sendCurrency,
  receiveCurrency,
  sendStatus,
  receiveStatus,
  sentAmount,
  receivedAmount,
}: StatusSectionProps) {
  const { t } = useTranslation();
  const sendDisplayStatus = getDisplayStatus(sendStatus);
  const receiveDisplayStatus = getDisplayStatus(receiveStatus);
  const sendStatusLabel = t(`transfer.swap2.modals.transactionStatus.statusLabels.${sendStatus}`);
  const receiveStatusLabel = t(
    `transfer.swap2.modals.transactionStatus.statusLabels.${receiveStatus}`,
  );

  return (
    <Box lx={{ gap: "s12" }}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {t("transfer.swap2.modals.transactionStatus.sections.status.heading")}
      </Text>
      <Box lx={{ gap: "s4", borderRadius: "md", backgroundColor: "surface", padding: "s12" }}>
        <StatusRow
          status={sendDisplayStatus}
          title={t(
            `transfer.swap2.modals.transactionStatus.sections.status.${
              sendStatus === "finished" ? "sendCompleted" : "sendPending"
            }`,
            { ticker: sendCurrency?.ticker ?? "" },
          )}
          subtitle={sendStatusLabel}
          value={sentAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
        />
        <StatusRow
          status={receiveDisplayStatus}
          title={t(
            `transfer.swap2.modals.transactionStatus.sections.status.${
              receiveStatus === "finished" ? "receiveCompleted" : "receivePending"
            }`,
            { ticker: receiveCurrency?.ticker ?? "" },
          )}
          subtitle={receiveStatusLabel}
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

