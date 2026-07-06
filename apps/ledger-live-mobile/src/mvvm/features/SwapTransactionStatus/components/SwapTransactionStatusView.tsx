import React from "react";
import { BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import type { SwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";
import { DetailsSection } from "./Details/DetailsSection";
import { FooterSection } from "./Footer/FooterSection";
import { StatusSection } from "./Status/StatusSection";
import { TransactionHeader } from "./TransactionHeader";

export function SwapTransactionStatusView({
  sendCurrency,
  receiveCurrency,
  createdAt,
  locale,
  sendStatus,
  receiveStatus,
  sentAmount,
  receivedAmount,
  feesAmount,
  receiveAccountName,
  receiveAccountCurrency,
  provider,
  providerData,
  swapId,
  explorerUrl,
  isStatusSectionLoading,
  isFooterLoading,
}: Readonly<SwapTransactionStatusViewModel>) {
  return (
    <BottomSheetScrollView
      testID="swap-transaction-status-scroll-view"
      showsVerticalScrollIndicator={false}
    >
      <Box lx={{ gap: "s24", paddingBottom: "s24" }}>
        <TransactionHeader
          sendCurrency={sendCurrency}
          receiveCurrency={receiveCurrency}
          createdAt={createdAt}
          locale={locale}
        />

        <StatusSection
          sendCurrency={sendCurrency}
          receiveCurrency={receiveCurrency}
          sendStatus={sendStatus}
          receiveStatus={receiveStatus}
          sentAmount={sentAmount}
          receivedAmount={receivedAmount}
          isLoading={isStatusSectionLoading}
        />

        <DetailsSection
          feesAmount={feesAmount}
          receiveAccountName={receiveAccountName}
          receiveAccountCurrency={receiveAccountCurrency}
          provider={provider}
          providerData={providerData}
          swapId={swapId}
        />

        <FooterSection explorerUrl={explorerUrl} isLoading={isFooterLoading} />
      </Box>
    </BottomSheetScrollView>
  );
}
