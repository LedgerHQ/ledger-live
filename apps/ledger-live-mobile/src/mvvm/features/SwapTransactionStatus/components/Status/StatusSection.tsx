import React from "react";
import {
  getSwapTransactionStatusDisplayStatus,
  getSwapTransactionStatusLabelKey,
  getSwapTransactionStatusTitleKey,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { StatusRow } from "./StatusRow";

const TRANSACTION_STATUS_TRANSLATION_PREFIX = "transfer.swap2.modals.transactionStatus";

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
  const sendDisplayStatus = getSwapTransactionStatusDisplayStatus(sendStatus);
  const receiveDisplayStatus = getSwapTransactionStatusDisplayStatus(receiveStatus);
  const sendStatusLabel = t(
    getSwapTransactionStatusLabelKey("send", sendStatus, TRANSACTION_STATUS_TRANSLATION_PREFIX),
  );
  const receiveStatusLabel = t(
    getSwapTransactionStatusLabelKey(
      "receive",
      receiveStatus,
      TRANSACTION_STATUS_TRANSLATION_PREFIX,
    ),
  );
  const sendTitle = t(
    getSwapTransactionStatusTitleKey("send", sendStatus, TRANSACTION_STATUS_TRANSLATION_PREFIX),
    {
      ticker: sendCurrency?.ticker ?? "",
    },
  );
  const receiveTitle = t(
    getSwapTransactionStatusTitleKey(
      "receive",
      receiveStatus,
      TRANSACTION_STATUS_TRANSLATION_PREFIX,
    ),
    {
      ticker: receiveCurrency?.ticker ?? "",
    },
  );

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
