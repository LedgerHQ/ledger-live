import React from "react";
import type { SwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";
import type { SwapTransactionStatusOrigin } from "../types";
import { TransactionHeader } from "./TransactionHeader";
import { StatusSection } from "./Status/StatusSection";
import { DetailsSection } from "./Details/DetailsSection";
import { FooterSection } from "./Footer/FooterSection";

type SwapTransactionStatusViewProps = Readonly<
  SwapTransactionStatusViewModel & { origin?: SwapTransactionStatusOrigin }
>;

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
  origin,
}: SwapTransactionStatusViewProps) {
  return (
    <>
      <TransactionHeader
        sendCurrency={sendCurrency}
        receiveCurrency={receiveCurrency}
        createdAt={createdAt}
        locale={locale}
        origin={origin}
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
    </>
  );
}
