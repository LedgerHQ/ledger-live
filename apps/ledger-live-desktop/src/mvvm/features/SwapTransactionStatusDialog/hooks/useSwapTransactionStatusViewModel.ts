import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { useEffect, useMemo, useState } from "react";
import {
  flattenAccounts,
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getSwapProvider,
  type AdditionalProviderConfig,
} from "@ledgerhq/live-common/exchange/providers/swap";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/transactionStatus/index";
import type { TransactionStatusValue } from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import { useSelector } from "LLD/hooks/redux";
import { useLLDCoinFamily } from "~/renderer/families";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { formatAmount, formatFeesAmount, getExplorerUrl, resolveAccountLike } from "../utils";
import { useSwapTransactionStatus } from "./useSwapTransactionStatus";

export function useSwapTransactionStatusViewModel(params: SwapTransactionStatusParams) {
  const transactionStatus = useSwapTransactionStatus(params);
  const accounts = useSelector(accountsSelector);
  const locale = useSelector(localeSelector);
  const details = transactionStatus.details;
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
  const { getTransactionExplorer } = useLLDCoinFamily(sendMainCurrency?.family);
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
  const receiveStatus = getReceiveDisplayStatus(
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

function getReceiveDisplayStatus(
  receiveStatus: TransactionStatusValue,
  currentStatus: TransactionStatusValue,
  sendStatus: TransactionStatusValue,
): TransactionStatusValue {
  if (receiveStatus === "unknown" && (currentStatus === "finished" || sendStatus === "finished")) {
    return "finished";
  }
  return receiveStatus;
}
