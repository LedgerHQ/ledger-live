import BigNumber from "bignumber.js";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getTransactionExplorer } from "@ledgerhq/live-common/explorers";
import type { Account, AccountLike } from "@ledgerhq/types-live";

const MAX_DISPLAY_DECIMALS = 8;

export type ResolvedAccountLike = {
  account: AccountLike;
  parentAccount?: Account;
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
}: {
  provider: string | undefined;
  swapId: string;
  operationHash: string | undefined;
  fromCurrency: ReturnType<typeof getAccountCurrency> | undefined;
}): string | undefined {
  if (!provider) return undefined;
  if (!operationHash && provider !== "swapsxyz") return undefined;
  const mainCurrency =
    fromCurrency?.type === "TokenCurrency" ? fromCurrency.parentCurrency : fromCurrency;

  switch (provider) {
    case "lifi":
      return operationHash ? `https://scan.li.fi/tx/${operationHash}` : undefined;
    case "thorswap":
      return operationHash ? `https://runescan.io/tx/${operationHash}` : undefined;
    case "nearintents":
      return operationHash ? `https://track.swapkit.dev/tx/${operationHash}` : undefined;
    case "swapsxyz":
      return `https://scan.swaps.xyz/transactions/${swapId}`;
    case "okx":
      return mainCurrency?.id && operationHash
        ? `https://web3.okx.com/fi/explorer/${mainCurrency.id}/tx/${operationHash}`
        : undefined;
    default:
      return mainCurrency && operationHash
        ? getTransactionExplorer(getDefaultExplorerView(mainCurrency), operationHash)
        : undefined;
  }
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

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function limitDisplayDecimals(rawAtomic: string, unitMagnitude: number): BigNumber {
  const value = new BigNumber(rawAtomic);
  const hiddenMagnitude = unitMagnitude - MAX_DISPLAY_DECIMALS;
  if (hiddenMagnitude <= 0) return value;

  const factor = new BigNumber(10).pow(hiddenMagnitude);
  return value.div(factor).decimalPlaces(0, BigNumber.ROUND_DOWN).times(factor);
}
