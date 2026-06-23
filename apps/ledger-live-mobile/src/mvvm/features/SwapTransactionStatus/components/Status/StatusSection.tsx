import React from "react";
import { getSwapTransactionStatusSectionItems } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
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
  const statusItems = getSwapTransactionStatusSectionItems({
    sendStatus,
    receiveStatus,
    sendTicker: sendCurrency?.ticker,
    receiveTicker: receiveCurrency?.ticker,
    translationPrefix: TRANSACTION_STATUS_TRANSLATION_PREFIX,
  });

  return (
    <Box lx={{ gap: "s12" }}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {t("transfer.swap2.modals.transactionStatus.sections.status.heading")}
      </Text>
      <Box lx={{ gap: "s4", borderRadius: "md", backgroundColor: "surface", padding: "s12" }}>
        <StatusRow
          status={statusItems.send.displayStatus}
          title={t(statusItems.send.titleKey, statusItems.send.titleValues)}
          subtitle={t(statusItems.send.labelKey)}
          value={sentAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
          isLoading={isLoading}
          lineStatus={statusItems.receive.displayStatus}
        />
        <StatusRow
          status={statusItems.receive.displayStatus}
          title={t(statusItems.receive.titleKey, statusItems.receive.titleValues)}
          subtitle={t(statusItems.receive.labelKey)}
          value={receivedAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
          isLoading={isLoading}
          isLast
        />
      </Box>
    </Box>
  );
}
