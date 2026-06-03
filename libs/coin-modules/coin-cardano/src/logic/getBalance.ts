import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { types as TyphonTypes } from "@stricahq/typhonjs";
import BigNumber from "bignumber.js";
import { APITransaction } from "../api/api-types";
import { getAllTransactionsByKeys } from "../api/fetchTransactions";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { calculateMinAdaForTokens, computeAdaBalance, deriveUtxos, mergeTokens } from "../logic";
import {
  EMPTY_CREDENTIAL_KEY,
  extractPaymentKeyFromAddress,
  extractStakeKeyFromAddress,
  isByronAddress,
} from "../utils";
import { NATIVE_ASSET, buildStake } from "./stake";

async function computeMinAdaForTokens(
  currency: CryptoCurrency,
  address: string,
  tokens: TyphonTypes.Token[],
): Promise<BigNumber> {
  const { protocolParams } = await fetchNetworkInfo(currency);
  return calculateMinAdaForTokens(address, tokens, protocolParams.utxoCostPerByte);
}

/**
 * Balances held by a Cardano address: native ADA + each token from its UTXOs, plus the
 * account's staking position (when delegated) as a separate native balance entry.
 *
 * Caveat: native/token totals cover only the payment credential of the passed address.
 * A Cardano account holds funds across many addresses (derived from its xpub), which the
 * single-address CoinModule contract cannot enumerate. Staking is account-complete (the
 * stake credential is shared across all the account's addresses).
 */
export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  // Byron addresses are valid (isValidAddress accepts them) but expose no Shelley payment
  // credential, so we cannot derive their UTXOs. Reject explicitly instead of silently
  // reporting a zero balance for an address that may actually hold funds.
  if (isByronAddress(address)) {
    throw new Error("Byron addresses are not supported");
  }

  const paymentKey = extractPaymentKeyFromAddress(address);
  const stakeKey = extractStakeKeyFromAddress(address);

  // The transaction-history fetch (for UTXOs) and the delegation fetch are independent network
  // calls, so run them in parallel — the history pagination can be sizeable. blockHeight 0
  // fetches the full history; getAllTransactionsByKeys is the shared pagination primitive (also
  // used by account sync), so the termination rule can't drift.
  const [{ transactions }, delegation] = await Promise.all([
    paymentKey === EMPTY_CREDENTIAL_KEY
      ? Promise.resolve<{ transactions: APITransaction[] }>({ transactions: [] })
      : getAllTransactionsByKeys([paymentKey], 0, currency),
    stakeKey ? getDelegationInfo(currency, stakeKey) : Promise.resolve(undefined),
  ]);

  const utxos = deriveUtxos(transactions, paymentKey);
  const utxosSum = utxos.reduce((sum, u) => sum.plus(u.amount), new BigNumber(0));
  const tokens = mergeTokens(utxos.flatMap(u => u.tokens)).filter(t => t.amount.gt(0));

  const rewards = delegation?.rewards ?? new BigNumber(0);

  // total / spendable share one definition with account sync (computeAdaBalance): the locked
  // (non-spendable) part is min-ADA backing the held tokens plus rewards that aren't yet
  // withdrawable (no dRep delegation). Only fetch network info for min-ADA when tokens exist.
  const minAdaForTokens = tokens.length
    ? await computeMinAdaForTokens(currency, address, tokens)
    : new BigNumber(0);
  const { total: nativeValue, spendable } = computeAdaBalance({
    utxosSum,
    minAdaForTokens,
    rewards,
    delegatedToDRep: !!delegation?.dRepHex,
  });
  const locked = nativeValue.minus(spendable);

  const balances: Balance[] = [
    {
      value: BigInt(nativeValue.toFixed(0)),
      asset: NATIVE_ASSET,
      locked: BigInt(locked.toFixed(0)),
    },
  ];

  const stake = buildStake(address, stakeKey, delegation);
  if (stake) {
    balances.push({ value: stake.amount, asset: NATIVE_ASSET, stake });
  }

  for (const token of tokens) {
    balances.push({
      value: BigInt(token.amount.toFixed(0)),
      asset: {
        // Cardano's canonical token asset id: policyId (28 bytes) concatenated with the asset
        // name, no separator (mirrors getTokenAssetId in buildSubAccounts). Keeps the reference
        // mappable to existing Cardano token identifiers / currency ids.
        type: "token",
        assetReference: `${token.policyId}${token.assetName}`,
        assetOwner: address,
      },
    });
  }

  return balances;
}
