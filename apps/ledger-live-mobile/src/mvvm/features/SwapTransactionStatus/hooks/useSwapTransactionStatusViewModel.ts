import { useEffect, useMemo, useState } from "react";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import {
  getSwapProvider,
  type AdditionalProviderConfig,
} from "@ledgerhq/live-common/exchange/providers/swap";
import {
  getSwapTransactionStatusReceiveDisplayStatus,
  type SwapTransactionStatusParams,
} from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { useSelector } from "~/context/hooks";
import byFamiliesOperationDetails from "~/generated/operationDetails";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { localeSelector } from "~/reducers/settings";
import { useMaybeAccountName } from "~/reducers/wallet";
import {
  formatAmount,
  formatFeesAmount,
  getExplorerUrl,
  resolveAccountLike,
  type TransactionExplorerBuilder,
} from "../utils";
import { useSwapTransactionStatus } from "./useSwapTransactionStatus";

export function useSwapTransactionStatusViewModel({
  params,
  onClose,
}: {
  params: SwapTransactionStatusParams;
  onClose: () => void;
}) {
  const transactionStatus = useSwapTransactionStatus({ params, onClose });
  const accounts = useSelector(flattenAccountsSelector);
  const locale = useSelector(localeSelector);
  const details = transactionStatus.details;
  const provider = details?.provider ?? params.provider;
  const sendResolved = useMemo(
    () => resolveAccountLike(accounts, details?.fromAccountId),
    [accounts, details?.fromAccountId],
  );
  const receiveResolved = useMemo(
    () => resolveAccountLike(accounts, details?.toAccountId),
    [accounts, details?.toAccountId],
  );

  const receiveAccount = receiveResolved
    ? getMainAccount(receiveResolved.account, receiveResolved.parentAccount)
    : undefined;
  const receiveAccountName = useMaybeAccountName(receiveAccount);

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
  const sendMainCurrency =
    sendCurrency?.type === "TokenCurrency"
      ? getCryptoCurrencyById(sendCurrency.parentCurrencyId)
      : sendCurrency;
  const getTransactionExplorer = useMemo<TransactionExplorerBuilder | undefined>(() => {
    if (!sendMainCurrency) return undefined;
    const familyDetails =
      byFamiliesOperationDetails[
        sendMainCurrency.family as keyof typeof byFamiliesOperationDetails
      ];

    return familyDetails && "getTransactionExplorer" in familyDetails
      ? (familyDetails.getTransactionExplorer as TransactionExplorerBuilder)
      : undefined;
  }, [sendMainCurrency]);
  const sentAmount = formatAmount(sendCurrency, details?.sentAmount, locale);
  const receivedAmount = formatAmount(
    receiveCurrency,
    details?.finalAmount ?? details?.receivedAmount,
    locale,
  );
  const feesAmount = formatFeesAmount(sendResolved, details?.feesAmount, locale);
  const currentStatus: TransactionStatusValue =
    transactionStatus.latestStatus?.status ?? details?.status ?? "pending";
  const sendStatus = details?.sendStatus ?? currentStatus;
  const receiveStatus = getSwapTransactionStatusReceiveDisplayStatus(
    details?.receiveStatus ?? currentStatus,
    currentStatus,
    sendStatus,
  );
  const explorerUrl = getExplorerUrl({
    provider,
    swapId: params.swapId,
    operationHash: details?.operationHash,
    fromCurrency: sendCurrency,
    getTransactionExplorer,
  });
  const isStatusSectionLoading =
    transactionStatus.isInitialLoading || !sendCurrency || !receiveCurrency;

  return {
    sendCurrency,
    receiveCurrency,
    receiveAccountCurrency: receiveAccount?.currency,
    createdAt: details?.createdAt,
    locale,
    sendStatus,
    receiveStatus,
    sentAmount,
    receivedAmount,
    feesAmount,
    receiveAccountName,
    provider,
    providerData,
    swapId: params.swapId,
    explorerUrl,
    isStatusSectionLoading,
    isFooterLoading: transactionStatus.isInitialLoading,
  };
}

export type SwapTransactionStatusViewModel = ReturnType<typeof useSwapTransactionStatusViewModel>;
