import { BigNumber } from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { StrKey } from "@stellar/stellar-sdk";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import { fetchSigners } from "../network";
import type { BalanceAsset, Transaction, TransactionRaw } from "../types";

export const STELLAR_BURN_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export const getAssetIdFromAsset = (asset: BalanceAsset) =>
  `${asset.asset_code}:${asset.asset_issuer}`;

export function getAmountValue(
  account: Account,
  transaction: Transaction,
  fees: BigNumber,
): BigNumber {
  // Asset
  if (transaction.subAccountId) {
    const asset = findSubAccountById(account, transaction.subAccountId) as TokenAccount;
    if (!asset) {
      throw new Error(`Sub-account with ID ${transaction.subAccountId} not found`);
    }
    return transaction.useAllAmount
      ? new BigNumber(asset.spendableBalance.toString())
      : transaction.amount;
  }
  // Native
  return transaction.useAllAmount && transaction.networkInfo
    ? BigNumber.max(new BigNumber(account.spendableBalance.toString()).minus(fees), 0)
    : transaction.amount;
}

export function getAssetCodeIssuer(tr: Transaction | TransactionRaw): string[] {
  if (tr.subAccountId) {
    const assetString = tr.subAccountId.split("+")[1];
    return assetString.split(":");
  }

  return [tr.assetReference || "", tr.assetOwner || ""];
}

export function isMemoValid(memoType: string, memoValue: string): boolean {
  switch (memoType) {
    case "MEMO_TEXT":
      if (memoValue.length > 28) {
        return false;
      }

      break;

    case "MEMO_ID":
      if (new BigNumber(memoValue.toString()).isNaN()) {
        return false;
      }

      break;

    case "MEMO_HASH":
    case "MEMO_RETURN":
      if (!memoValue.length || memoValue.length !== 64) {
        return false;
      }

      break;
  }

  return true;
}

export async function isAccountMultiSign(account: string): Promise<boolean> {
  const signers = await fetchSigners(account);
  return signers.length > 1;
}

/**
 * Returns true if address is valid, false if it's invalid (can't parse or wrong checksum)
 *
 * @param {*} address
 */
export function isAddressValid(address: string): boolean {
  if (!address) return false;

  // FIXME Workaround for burn address, see https://ledgerhq.atlassian.net/browse/LIVE-4014
  if (address === STELLAR_BURN_ADDRESS) return false;

  try {
    return StrKey.isValidEd25519PublicKey(address) || StrKey.isValidMed25519PublicKey(address);
  } catch {
    return false;
  }
}
