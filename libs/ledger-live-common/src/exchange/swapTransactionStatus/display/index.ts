import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { getAccountCurrency, getMainAccount } from "../../../account/index";
import { formatCurrencyUnit, getCryptoCurrencyById } from "../../../currencies/index";
import { getSwapProvider, type AdditionalProviderConfig } from "../../providers/swap";
import { getProviderName } from "../../swap/utils/index";
import type { SwapTransactionStatusControllerViewModel } from "../hooks/useSwapTransactionStatusController";
import type { SwapTransactionStatusParams } from "../types";
import {
  getDefaultExplorerView,
  getTransactionExplorer as getDefaultTransactionExplorer,
} from "../../../explorers";
import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  ExplorerView,
} from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { TransactionStatusValue } from "@ledgerhq/wallet-api-exchange-module";

const MAX_DISPLAY_DECIMALS = 8;
const SWAPS_XYZ_SCAN_URL = "https://scan.swaps.xyz/transactions";

export type ResolvedSwapTransactionStatusAccountLike = {
  account: AccountLike;
  parentAccount?: Account;
};

type ProviderExplorerParams = Readonly<{
  operationHash: string;
  swapId: string;
  currencyId?: string;
}>;

type ProviderExplorer = Readonly<{
  requiresOperationHash: boolean;
  buildUrl: (params: ProviderExplorerParams) => string | undefined;
}>;

export type SwapTransactionStatusTransactionExplorerBuilder = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
) => string | null | undefined;

export type SwapTransactionStatusDisplayStatus = "success" | "pending" | "error" | "unknown";

export type SwapTransactionStatusDirection = "send" | "receive";

export type SwapTransactionStatusVisualTone = "success" | "error" | "muted";

export type SwapTransactionStatusVisualIcon = "success" | "error" | "pending";

export type SwapTransactionStatusDisplayViewModel = {
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  receiveAccountCurrency?: CryptoCurrency;
  createdAt?: number;
  locale: string;
  sendStatus: TransactionStatusValue;
  receiveStatus: TransactionStatusValue;
  sentAmount?: string;
  receivedAmount?: string;
  feesAmount?: string;
  receiveAccountName?: string;
  provider?: string;
  providerData?: AdditionalProviderConfig;
  swapId: string;
  explorerUrl?: string;
  isStatusSectionLoading: boolean;
  isFooterLoading: boolean;
};

export type UseSwapTransactionStatusDisplayViewModelParams = Readonly<{
  params: SwapTransactionStatusParams;
  transactionStatus: SwapTransactionStatusControllerViewModel;
  accounts: AccountLike[];
  locale: string;
  useReceiveAccountName: (account: Account | undefined) => string | undefined;
  useTransactionExplorerBuilder?: (
    currency: CryptoCurrency | undefined,
  ) => SwapTransactionStatusTransactionExplorerBuilder | undefined;
}>;

export type SwapTransactionStatusSectionItem = {
  displayStatus: SwapTransactionStatusDisplayStatus;
  titleKey: string;
  titleValues: { ticker: string };
  labelKey: string;
};

export type SwapTransactionStatusDetailsViewModel = {
  providerName?: string;
  providerMainUrl?: string;
  shouldShowProvider: boolean;
  truncatedSwapId: string;
};

const PROVIDER_EXPLORERS: Record<string, ProviderExplorer> = {
  lifi: {
    requiresOperationHash: true,
    buildUrl: ({ operationHash }) => `https://scan.li.fi/tx/${operationHash}`,
  },
  thorswap: {
    requiresOperationHash: true,
    buildUrl: ({ operationHash }) => `https://runescan.io/tx/${operationHash}`,
  },
  nearintents: {
    requiresOperationHash: true,
    buildUrl: ({ operationHash }) => `https://track.swapkit.dev/tx/${operationHash}`,
  },
  swapsxyz: {
    requiresOperationHash: false,
    buildUrl: ({ swapId }) => `${SWAPS_XYZ_SCAN_URL}/${swapId}`,
  },
  moonpay_trade: {
    requiresOperationHash: false,
    buildUrl: ({ swapId }) => `${SWAPS_XYZ_SCAN_URL}/${swapId}`,
  },
  okx: {
    requiresOperationHash: true,
    buildUrl: ({ operationHash, currencyId }) => {
      if (!currencyId) return undefined;
      return `https://web3.okx.com/fi/explorer/${currencyId}/tx/${operationHash}`;
    },
  },
};

export function resolveSwapTransactionStatusAccountLike(
  accounts: AccountLike[],
  accountId: string | undefined,
): ResolvedSwapTransactionStatusAccountLike | undefined {
  if (!accountId) return undefined;
  const account = accounts.find(a => a.id === accountId);
  if (!account) return undefined;
  if (account.type !== "TokenAccount") return { account };
  const parentAccount = accounts.find(
    (candidate): candidate is Account =>
      candidate.type === "Account" && candidate.id === account.parentId,
  );
  return { account, parentAccount };
}

export function formatSwapTransactionStatusAmount(
  currency: { units: { code: string; magnitude: number; name: string }[] } | undefined,
  rawAtomic: string | undefined,
  locale: string,
): string | undefined {
  if (!currency || !rawAtomic) return undefined;
  const unit = currency.units[0];
  return formatCurrencyUnit(unit, limitDisplayDecimals(rawAtomic, unit.magnitude), {
    showCode: true,
    locale,
    disableRounding: true,
  });
}

export function formatSwapTransactionStatusFeesAmount(
  resolved: ResolvedSwapTransactionStatusAccountLike | undefined,
  rawAtomic: string | undefined,
  locale: string,
): string | undefined {
  if (!resolved || !rawAtomic) return undefined;
  const mainAccount = getMainAccount(resolved.account, resolved.parentAccount);
  return formatSwapTransactionStatusAmount(mainAccount.currency, rawAtomic, locale);
}

export function getSwapTransactionStatusExplorerUrl({
  provider,
  swapId,
  operationHash,
  fromCurrency,
  getTransactionExplorer,
}: {
  provider: string | undefined;
  swapId: string;
  operationHash: string | undefined;
  fromCurrency: CryptoOrTokenCurrency | undefined;
  getTransactionExplorer?: SwapTransactionStatusTransactionExplorerBuilder;
}): string | undefined {
  if (!provider) return undefined;
  const mainCurrency =
    fromCurrency?.type === "TokenCurrency"
      ? getCryptoCurrencyById(fromCurrency.parentCurrencyId)
      : fromCurrency;
  const providerExplorer = PROVIDER_EXPLORERS[provider];

  if (providerExplorer) {
    if (providerExplorer.requiresOperationHash && !operationHash) return undefined;
    return providerExplorer.buildUrl({
      operationHash: operationHash ?? "",
      swapId,
      currencyId: mainCurrency?.id,
    });
  }

  if (!mainCurrency || !operationHash) return undefined;
  return getCurrencyTransactionExplorerUrl(mainCurrency, operationHash, getTransactionExplorer);
}

export function formatSwapTransactionStatusCreatedAt(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function truncateSwapTransactionStatusIdentifier(value: string): string {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

export function getSwapTransactionStatusDetailsViewModel({
  provider,
  providerData,
  swapId,
}: Readonly<{
  provider?: string;
  providerData?: AdditionalProviderConfig;
  swapId: string;
}>): SwapTransactionStatusDetailsViewModel {
  const providerName = provider ? getProviderName(provider) : undefined;

  return {
    providerName,
    providerMainUrl: providerData?.mainUrl,
    shouldShowProvider: Boolean(provider && providerName),
    truncatedSwapId: truncateSwapTransactionStatusIdentifier(swapId),
  };
}

export function getSwapTransactionStatusReceiveDisplayStatus(
  receiveStatus: TransactionStatusValue,
  currentStatus: TransactionStatusValue,
  sendStatus: TransactionStatusValue,
): TransactionStatusValue {
  if (receiveStatus === "unknown" && (currentStatus === "finished" || sendStatus === "finished")) {
    return "finished";
  }
  return receiveStatus;
}

export function getSwapTransactionStatusTitleKey(
  direction: SwapTransactionStatusDirection,
  currentStatus: TransactionStatusValue,
  translationPrefix: string,
): string {
  if (direction === "send" && currentStatus === "finished") {
    return `${translationPrefix}.sections.status.sendCompleted`;
  }
  if (direction === "send") {
    return `${translationPrefix}.sections.status.sendPending`;
  }
  if (currentStatus === "finished") {
    return `${translationPrefix}.sections.status.receiveCompleted`;
  }
  return `${translationPrefix}.sections.status.receivePending`;
}

export function getSwapTransactionStatusLabelKey(
  direction: SwapTransactionStatusDirection,
  currentStatus: TransactionStatusValue,
  translationPrefix: string,
): string {
  if (direction === "receive" && currentStatus === "refunded") {
    return `${translationPrefix}.statusLabels.cancelled`;
  }
  return `${translationPrefix}.statusLabels.${currentStatus}`;
}

export function getSwapTransactionStatusDisplayStatus(
  currentStatus: TransactionStatusValue,
): SwapTransactionStatusDisplayStatus {
  switch (currentStatus) {
    case "finished":
      return "success";
    case "expired":
    case "refunded":
      return "error";
    case "unknown":
      return "unknown";
    default:
      return "pending";
  }
}

export function getSwapTransactionStatusVisualTokens(status: SwapTransactionStatusDisplayStatus): {
  icon: SwapTransactionStatusVisualIcon;
  tone: SwapTransactionStatusVisualTone;
} {
  if (status === "success") {
    return { icon: "success", tone: "success" };
  }
  if (status === "error") {
    return { icon: "error", tone: "error" };
  }
  return { icon: "pending", tone: "muted" };
}

export function getSwapTransactionStatusSectionItems({
  sendStatus,
  receiveStatus,
  sendTicker,
  receiveTicker,
  translationPrefix,
}: Readonly<{
  sendStatus: TransactionStatusValue;
  receiveStatus: TransactionStatusValue;
  sendTicker?: string;
  receiveTicker?: string;
  translationPrefix: string;
}>): {
  send: SwapTransactionStatusSectionItem;
  receive: SwapTransactionStatusSectionItem;
} {
  return {
    send: {
      displayStatus: getSwapTransactionStatusDisplayStatus(sendStatus),
      titleKey: getSwapTransactionStatusTitleKey("send", sendStatus, translationPrefix),
      titleValues: { ticker: sendTicker ?? "" },
      labelKey: getSwapTransactionStatusLabelKey("send", sendStatus, translationPrefix),
    },
    receive: {
      displayStatus: getSwapTransactionStatusDisplayStatus(receiveStatus),
      titleKey: getSwapTransactionStatusTitleKey("receive", receiveStatus, translationPrefix),
      titleValues: { ticker: receiveTicker ?? "" },
      labelKey: getSwapTransactionStatusLabelKey("receive", receiveStatus, translationPrefix),
    },
  };
}

export function useSwapTransactionStatusDisplayViewModel({
  params,
  transactionStatus,
  accounts,
  locale,
  useReceiveAccountName,
  useTransactionExplorerBuilder = useUndefinedTransactionExplorerBuilder,
}: UseSwapTransactionStatusDisplayViewModelParams): SwapTransactionStatusDisplayViewModel {
  const details = transactionStatus.details;
  const provider = details?.provider ?? params.provider;
  const sendResolved = useMemo(
    () => resolveSwapTransactionStatusAccountLike(accounts, details?.fromAccountId),
    [accounts, details?.fromAccountId],
  );
  const receiveResolved = useMemo(
    () => resolveSwapTransactionStatusAccountLike(accounts, details?.toAccountId),
    [accounts, details?.toAccountId],
  );

  const receiveAccount = receiveResolved
    ? getMainAccount(receiveResolved.account, receiveResolved.parentAccount)
    : undefined;
  const receiveAccountName = useReceiveAccountName(receiveAccount);

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
  const getTransactionExplorer = useTransactionExplorerBuilder(sendMainCurrency);
  const sentAmount = formatSwapTransactionStatusAmount(sendCurrency, details?.sentAmount, locale);
  const receivedAmount = formatSwapTransactionStatusAmount(
    receiveCurrency,
    details?.finalAmount ?? details?.receivedAmount,
    locale,
  );
  const feesAmount = formatSwapTransactionStatusFeesAmount(
    sendResolved,
    details?.feesAmount,
    locale,
  );
  const currentStatus: TransactionStatusValue =
    transactionStatus.latestStatus?.status ?? details?.status ?? "pending";
  const sendStatus = details?.sendStatus ?? currentStatus;
  const receiveStatus = getSwapTransactionStatusReceiveDisplayStatus(
    details?.receiveStatus ?? currentStatus,
    currentStatus,
    sendStatus,
  );
  const explorerUrl = getSwapTransactionStatusExplorerUrl({
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

function limitDisplayDecimals(rawAtomic: string, unitMagnitude: number): BigNumber {
  const value = new BigNumber(rawAtomic);
  const hiddenMagnitude = unitMagnitude - MAX_DISPLAY_DECIMALS;
  if (hiddenMagnitude <= 0) return value;

  const factor = new BigNumber(10).pow(hiddenMagnitude);
  return value.div(factor).decimalPlaces(0, BigNumber.ROUND_DOWN).times(factor);
}

function getCurrencyTransactionExplorerUrl(
  mainCurrency: CryptoCurrency,
  operationHash: string,
  getTransactionExplorer: SwapTransactionStatusTransactionExplorerBuilder | undefined,
): string | undefined {
  const explorerView = getDefaultExplorerView(mainCurrency);
  const operation = { hash: operationHash, extra: {} } as Operation;

  return (
    getTransactionExplorer?.(explorerView, operation) ??
    getDefaultTransactionExplorer(explorerView, operationHash)
  );
}

function useUndefinedTransactionExplorerBuilder(): undefined {
  return undefined;
}
