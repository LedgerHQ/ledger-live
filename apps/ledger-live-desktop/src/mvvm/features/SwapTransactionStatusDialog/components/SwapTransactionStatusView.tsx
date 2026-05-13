import React, { useEffect, useMemo, useState } from "react";
import { flattenAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  getSwapProvider,
  type AdditionalProviderConfig,
} from "@ledgerhq/live-common/exchange/providers/swap";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import type { SwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatus";
import { formatAmount, formatFeesAmount, getExplorerUrl, resolveAccountLike } from "../utils";

import { TransactionHeader } from "./TransactionHeader";
import { StatusSection } from "./Status/StatusSection";
import { DetailsSection } from "./Details/DetailsSection";
import { FooterSection } from "./Footer/FooterSection";

type SwapTransactionStatusViewProps = Readonly<{
  params: SwapTransactionStatusParams;
  viewModel: SwapTransactionStatusViewModel;
}>;

export function SwapTransactionStatusView({ params, viewModel }: SwapTransactionStatusViewProps) {
  const accounts = useSelector(accountsSelector);
  const locale = useSelector(localeSelector);
  const details = viewModel.details;
  const provider = details?.provider ?? params.provider;
  const flattenedAccounts = useMemo(() => flattenAccounts(accounts), [accounts]);
  const sendResolved = useMemo(
    () => resolveAccountLike(flattenedAccounts, details?.fromAccountId),
    [details?.fromAccountId, flattenedAccounts],
  );
  const receiveResolved = useMemo(
    () => resolveAccountLike(flattenedAccounts, details?.toAccountId),
    [details?.toAccountId, flattenedAccounts],
  );

  const receiveAccountName = useMaybeAccountName(receiveResolved?.account);

  const [providerData, setProviderData] = useState<AdditionalProviderConfig | undefined>();
  useEffect(() => {
    let cancelled = false;
    setProviderData(undefined);

    if (provider) {
      getSwapProvider(provider)
        .then(data => {
          if (!cancelled) setProviderData(data);
        })
        .catch(() => {
          if (!cancelled) setProviderData(undefined);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [provider]);

  const sendCurrency = sendResolved ? getAccountCurrency(sendResolved.account) : undefined;
  const receiveCurrency = receiveResolved ? getAccountCurrency(receiveResolved.account) : undefined;
  const sentAmount = formatAmount(sendCurrency, details?.sentAmount, locale);
  const receivedAmount = formatAmount(
    receiveCurrency,
    details?.finalAmount ?? details?.receivedAmount,
    locale,
  );
  const feesAmount = formatFeesAmount(sendResolved, details?.feesAmount, locale);
  const currentStatus = viewModel.latestStatus?.status ?? details?.status ?? "pending";
  const sendStatus = details?.sendStatus ?? currentStatus;
  const receiveStatus = details?.receiveStatus ?? currentStatus;
  const explorerUrl = getExplorerUrl({
    provider,
    swapId: params.swapId,
    operationHash: details?.operationHash,
    fromCurrency: sendCurrency,
  });

  return (
    <>
      <TransactionHeader
        sendCurrency={sendCurrency}
        receiveCurrency={receiveCurrency}
        createdAt={details?.createdAt}
        locale={locale}
      />

      <StatusSection
        sendCurrency={sendCurrency}
        receiveCurrency={receiveCurrency}
        sendStatus={sendStatus}
        receiveStatus={receiveStatus}
        sentAmount={sentAmount}
        receivedAmount={receivedAmount}
        isLoading={viewModel.isInitialLoading}
      />

      <DetailsSection
        feesAmount={feesAmount}
        receiveAccountName={receiveAccountName}
        receiveCurrency={receiveCurrency}
        provider={provider}
        providerData={providerData}
        swapId={params.swapId}
      />

      <FooterSection explorerUrl={explorerUrl} isLoading={viewModel.isInitialLoading} />
    </>
  );
}
