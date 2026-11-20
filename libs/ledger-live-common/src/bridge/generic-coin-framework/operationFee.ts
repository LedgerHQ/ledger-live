import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@domain/entity-currency-token";
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
 * asset, as for a fee another account paid.
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
    const settle = (token: TokenCurrency | undefined) => {
      if (active) setResolved({ key: lookupKey, token });
    };
    getBridgeApi(currency, currency.family)
      .then(bridgeApi => bridgeApi.getTokenFromAsset?.(asset))
      .then(settle, () => settle(undefined));
    return () => {
      active = false;
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
