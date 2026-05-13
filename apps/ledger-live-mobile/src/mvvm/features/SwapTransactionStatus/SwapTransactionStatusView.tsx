import React, { useEffect, useMemo, useState } from "react";
import { Linking, ScrollView } from "react-native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  getSwapProvider,
  type AdditionalProviderConfig,
} from "@ledgerhq/live-common/exchange/providers/swap";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { localeSelector } from "~/reducers/settings";
import { useMaybeAccountName } from "~/reducers/wallet";
import type { SwapTransactionStatusViewModel } from "./hooks/useSwapTransactionStatusViewModel";
import { DetailsSection } from "./Details/DetailsSection";
import { StatusSection } from "./Status/StatusSection";
import { TransactionHeader } from "./TransactionHeader";
import { formatAmount, formatFeesAmount, getExplorerUrl, resolveAccountLike } from "./utils";

type SwapTransactionStatusViewProps = {
  params: SwapTransactionStatusParams;
  viewModel: SwapTransactionStatusViewModel;
};

export function SwapTransactionStatusView({ params, viewModel }: SwapTransactionStatusViewProps) {
  const { t } = useTranslation();
  const details = viewModel.details;
  const provider = details?.provider ?? params.provider;
  const accounts = useSelector(flattenAccountsSelector);
  const locale = useSelector(localeSelector);
  const sendResolved = useMemo(
    () => resolveAccountLike(accounts, details?.fromAccountId),
    [accounts, details?.fromAccountId],
  );
  const receiveResolved = useMemo(
    () => resolveAccountLike(accounts, details?.toAccountId),
    [accounts, details?.toAccountId],
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
    <ScrollView showsVerticalScrollIndicator={false}>
      <Box lx={{ gap: "s24", paddingBottom: "s24" }}>
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
            size="lg"
            icon={ExternalLink}
            lx={{ width: "full" }}
            onPress={() => Linking.openURL(explorerUrl).catch(() => {})}
          >
            {t("transfer.swap2.modals.transactionStatus.actions.viewInExplorer")}
          </Button>
        ) : null}
      </Box>
    </ScrollView>
  );
}
