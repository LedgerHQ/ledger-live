import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getFeesCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { log } from "@ledgerhq/logs";
import type { Account, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { getBridgeApi } from "./bridge";

/** A fee paid in another asset than the native coin, as the generic bridge stores it. */
export type OperationFee = { asset: AssetInfo; amount: BigNumber };

/** A fee paid in a token, in that token's units. */
export type OperationFeeInToken = { currency: TokenCurrency; amount: BigNumber };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonNativeAsset = (value: unknown): value is AssetInfo =>
  isRecord(value) && typeof value.type === "string" && value.type !== "native";

/**
 * The fee of an operation whose transaction paid it in another asset than the native coin: the
 * generic bridge leaves it out of `fee` and keeps it in `extra.feeAsset` and `extra.feeAmount`.
 *
 * @returns the fee asset and amount, or undefined for a native fee or another `extra` shape
 */
export function readOperationFee(operation: Operation): OperationFee | undefined {
  if (!isRecord(operation.extra)) return undefined;
  const { feeAsset, feeAmount } = operation.extra;
  if (!isNonNativeAsset(feeAsset)) return undefined;
  if (typeof feeAmount !== "string" || !/^\d+$/.test(feeAmount)) return undefined;
  return { asset: feeAsset, amount: new BigNumber(feeAmount) };
}

/** The tries of a failed lookup, 1 s then 2, 4 and 8 s apart, before the fee stays hidden. */
const MAX_LOOKUP_ATTEMPTS = 5;
const retryDelay = (attempt: number): number => 1000 * 2 ** attempt;

/**
 * The token of the sub-account that holds the FEES operation of the transaction: the generic
 * bridge charges a fee the account paid there, in the fee token.
 */
function findFeeToken(hash: string, account: Account): TokenCurrency | undefined {
  const tokenAccount = (account.subAccounts ?? []).find(subAccount =>
    subAccount.operations.some(
      op => op.hash === hash && op.type === "FEES" && readOperationFee(op) !== undefined,
    ),
  );
  return tokenAccount?.token;
}

/**
 * The currency and amount of the fee of an operation whose transaction paid it in a token. The
 * token is that of the sub-account charged with the fee, or else the family's token of the fee
 * asset, as for a fee another account paid. That lookup is a family bridge call: the family may
 * query an RTK Query endpoint (the CAL store, for instance), so the hook uses no RTK Query hook.
 *
 * @param operation the operation shown
 * @param account the main account of the operation
 * @returns undefined for a native fee; the token and amount; or null while the token is unresolved
 */
export function useOperationFeeCurrency(
  operation: Operation,
  account: Account,
): OperationFeeInToken | null | undefined {
  const fee = useMemo(() => readOperationFee(operation), [operation]);
  const heldToken = useMemo(
    () => (fee ? findFeeToken(operation.hash, account) : undefined),
    [fee, operation.hash, account],
  );
  const [resolved, setResolved] = useState<{ key: string; token: TokenCurrency | undefined }>();

  const { currency } = account;
  // What a lookup answers, as a key: a synced operation is a new object with the same fee asset,
  // and a token resolved for another operation, asset or currency never shows.
  const lookupKey =
    fee && !heldToken ? JSON.stringify([operation.id, currency.id, fee.asset]) : undefined;
  useEffect(() => {
    if (lookupKey === undefined) return;
    const [, , asset]: [string, string, AssetInfo] = JSON.parse(lookupKey);
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    // A failed lookup (offline, for instance) is tried again a few times; an unknown token is final.
    const lookUp = (attempt: number) => {
      getBridgeApi(currency, currency.family)
        .then(bridgeApi => (active ? bridgeApi.getTokenFromAsset?.(asset) : undefined))
        .then(
          token => {
            if (active) setResolved({ key: lookupKey, token });
          },
          error => {
            log("generic-coin-framework", "fee token lookup failed", { asset, attempt, error });
            if (active && attempt + 1 < MAX_LOOKUP_ATTEMPTS) {
              retry = setTimeout(() => lookUp(attempt + 1), retryDelay(attempt));
            }
          },
        );
    };
    lookUp(0);
    return () => {
      active = false;
      clearTimeout(retry);
    };
  }, [lookupKey, currency]);

  const lookedUp =
    resolved !== undefined && resolved.key === lookupKey ? resolved.token : undefined;
  const token = heldToken ?? lookedUp;
  return useMemo(() => {
    if (!fee) return undefined;
    return token ? { currency: token, amount: fee.amount } : null;
  }, [fee, token]);
}

/** The fee an operation details screen shows. */
export type FeeDisplay = {
  currency: CryptoCurrency | TokenCurrency;
  amount: BigNumber;
  /** The fee is in a currency not resolved yet: show no fee rather than one in another unit. */
  isUnresolved: boolean;
};

/**
 * The currency and amount of an operation's fee: the family's own answer first, then a fee the
 * generic bridge stores in a token, then the account's fee currency.
 *
 * @param operation the operation shown
 * @param account the main account of the operation
 * @param familyCurrency the family's fee currency: undefined when it has none, null while unresolved
 * @param tokenFee the result of {@link useOperationFeeCurrency}
 * @param getDisplayFee the family's fee amount, for a fee in the family's or the account's currency
 * @returns the currency and amount to show, and whether to hide the fee while it is unresolved
 */
export function resolveFeeDisplay({
  operation,
  account,
  familyCurrency,
  tokenFee,
  getDisplayFee,
}: {
  operation: Operation;
  account: Account;
  familyCurrency: CryptoCurrency | TokenCurrency | null | undefined;
  tokenFee: OperationFeeInToken | null | undefined;
  getDisplayFee?: (
    operation: Operation,
    account: Account,
    currency: CryptoCurrency | TokenCurrency,
  ) => BigNumber | undefined;
}): FeeDisplay {
  const genericFee = familyCurrency === undefined ? tokenFee : undefined;
  if (genericFee) return { ...genericFee, isUnresolved: false };
  const currency = familyCurrency ?? getFeesCurrency(account);
  const amount = getDisplayFee?.(operation, account, currency) ?? operation.fee;
  return { currency, amount, isUnresolved: familyCurrency === null || genericFee === null };
}
