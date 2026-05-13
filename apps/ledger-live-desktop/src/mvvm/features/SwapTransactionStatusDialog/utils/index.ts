import BigNumber from "bignumber.js";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  getDefaultExplorerView,
  getTransactionExplorer as getDefaultTransactionExplorer,
} from "@ledgerhq/live-common/explorers";
import type { CryptoCurrency, ExplorerView } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";

const MAX_DISPLAY_DECIMALS = 8;

export type ResolvedAccountLike = {
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

export type TransactionExplorerBuilder = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
) => string | null | undefined;

const SWAPS_XYZ_SCAN_URL = "https://scan.swaps.xyz/transactions";

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

export function resolveAccountLike(
  accounts: AccountLike[],
  accountId: string | undefined,
): ResolvedAccountLike | undefined {
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

export function formatAmount(
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

export function formatFeesAmount(
  resolved: ResolvedAccountLike | undefined,
  rawAtomic: string | undefined,
  locale: string,
): string | undefined {
  if (!resolved || !rawAtomic) return undefined;
  const mainAccount = getMainAccount(resolved.account, resolved.parentAccount);
  return formatAmount(mainAccount.currency, rawAtomic, locale);
}

export function getExplorerUrl({
  provider,
  swapId,
  operationHash,
  fromCurrency,
  getTransactionExplorer,
}: {
  provider: string | undefined;
  swapId: string;
  operationHash: string | undefined;
  fromCurrency: ReturnType<typeof getAccountCurrency> | undefined;
  getTransactionExplorer?: TransactionExplorerBuilder;
}): string | undefined {
  if (!provider) return undefined;
  const mainCurrency =
    fromCurrency?.type === "TokenCurrency" ? fromCurrency.parentCurrency : fromCurrency;
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

export function formatCreatedAt(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function truncateMiddle(value: string): string {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
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
  getTransactionExplorer: TransactionExplorerBuilder | undefined,
): string | undefined {
  const explorerView = getDefaultExplorerView(mainCurrency);
  const operation = { hash: operationHash, extra: {} } as Operation;

  return (
    getTransactionExplorer?.(explorerView, operation) ??
    getDefaultTransactionExplorer(explorerView, operationHash)
  );
}
