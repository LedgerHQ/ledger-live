import React from "react";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Box, Skeleton, Text } from "@ledgerhq/lumen-ui-rnative";
import { useStatusSectionViewModel } from "../../hooks/useStatusSectionViewModel";
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
  const { heading, sendRow, receiveRow } = useStatusSectionViewModel({
    sendCurrency,
    receiveCurrency,
    sendStatus,
    receiveStatus,
  });

  return (
    <Box lx={{ gap: "s12" }}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {heading}
      </Text>
      <Box lx={{ gap: "s4", borderRadius: "md", backgroundColor: "surface", padding: "s12" }}>
        <StatusRow
          status={sendRow.status}
          title={sendRow.title}
          subtitle={sendRow.subtitle}
          value={sentAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
          isLoading={isLoading}
          lineStatus={sendRow.lineStatus}
          testId="swap-transaction-status-send"
        />
        <StatusRow
          status={receiveRow.status}
          title={receiveRow.title}
          subtitle={receiveRow.subtitle}
          value={receivedAmount ?? <Skeleton lx={{ height: "s16", width: "s96" }} />}
          isLoading={isLoading}
          isLast
          testId="swap-transaction-status-receive"
        />
      </Box>
    </Box>
  );
}
