import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { flattenAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  getSwapProvider,
  type AdditionalProviderConfig,
} from "@ledgerhq/live-common/exchange/providers/swap";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import { Button } from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { useSelector } from "LLD/hooks/redux";
import { openURL } from "~/renderer/linking";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import type { SwapTransactionStatusViewModel } from "./useSwapTransactionStatus";
import { formatAmount, formatFeesAmount, getExplorerUrl, resolveAccountLike } from "./utils";

import { TransactionHeader } from "./TransactionHeader";
import { StatusSection } from "./Status/StatusSection";
import { DetailsSection } from "./Details/DetailsSection";

type SwapTransactionStatusViewProps = {
  params: SwapTransactionStatusParams;
  viewModel: SwapTransactionStatusViewModel;
};

export function SwapTransactionStatusView({ params, viewModel }: SwapTransactionStatusViewProps) {
  const { t } = useTranslation();
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
    if (!provider) return;
    let cancelled = false;
    getSwapProvider(provider).then(data => {
      if (!cancelled) setProviderData(data);
    });
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
        currentStatus={currentStatus}
        sentAmount={sentAmount}
        receivedAmount={receivedAmount}
      />

      <DetailsSection
        feesAmount={feesAmount}
        receiveAccountName={receiveAccountName}
        receiveCurrency={receiveCurrency}
        provider={provider}
        providerData={providerData}
        swapId={params.swapId}
      />

      {explorerUrl ? (
        <Button
          appearance="transparent"
          isFull
          size="md"
          icon={ExternalLink}
          onClick={() => openURL(explorerUrl, "SwapTransactionStatus_ViewExplorer")}
        >
          {t("swap2.modals.transactionStatus.actions.viewInExplorer")}
        </Button>
      ) : null}
    </>
  );
}
