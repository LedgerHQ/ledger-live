import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import type { OperationCommon } from "./types";

/** A FEES operation of a fee token, with that token's asset as the family derives it. */
export type TokenFeeOperation = { operation: OperationCommon; asset: AssetInfo };

/**
 * Whether two addresses name the same account: a hexadecimal address in any case (an EVM checksum
 * and its lower case), any other address exactly, as base58 and base32 addresses are case-sensitive.
 */
function isSameAccount(a: string, b: string): boolean {
  const hex = /^0x[0-9a-fA-F]+$/;
  return hex.test(a) && hex.test(b) ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/** The first operation of each transaction whose fee the account paid in another asset. */
function nonNativeFeeSources(operations: OperationCommon[], address: string): OperationCommon[] {
  const sources = new Map<string, OperationCommon>();
  for (const op of operations) {
    const { feeAsset, feeAmount, feePayer } = op.extra ?? {};
    if (sources.has(op.hash) || feeAsset === undefined || typeof feeAmount !== "string") continue;
    if (typeof feePayer === "string" && isSameAccount(feePayer, address)) sources.set(op.hash, op);
  }
  return [...sources.values()];
}

/**
 * One FEES operation of the fee token for each transaction whose fee the account paid in another
 * asset than the native coin (ADR-068): the fee is charged once, in its own asset, and the
 * operations of the transaction leave it out (`adaptCoreOperationToLiveOperation`). An unknown
 * payer charges no account.
 *
 * Each operation carries the fee token's asset as `getAssetFromToken` derives it, so it joins the
 * sub-account `buildSubAccounts` builds from the balance of that asset. A token that does not
 * resolve, or is blacklisted, gets no operation, as for any other operation of that token. A failed
 * lookup fails the sync: once the watermark passes the transaction, its fee is never read again.
 *
 * @param operations the operations of the sync, adapted to Live
 * @param address the account address
 * @param bridgeApi the family token lookups
 * @param blacklistedTokenIds tokens the user hides
 * @returns each FEES operation with the fee token's asset
 */
export async function buildTokenFeeOperations(
  operations: OperationCommon[],
  address: string,
  {
    getTokenFromAsset,
    getAssetFromToken,
  }: Pick<BridgeApi, "getTokenFromAsset" | "getAssetFromToken">,
  blacklistedTokenIds: string[],
): Promise<TokenFeeOperation[]> {
  const sources = nonNativeFeeSources(operations, address);
  if (sources.length === 0) return [];
  if (!getTokenFromAsset || !getAssetFromToken) {
    log("generic-coin-framework", "fees paid in a token, but the family cannot resolve tokens", {
      hashes: sources.map(op => op.hash),
    });
    return [];
  }

  const result: TokenFeeOperation[] = [];
  for (const source of sources) {
    const feeAsset: AssetInfo = source.extra.feeAsset;
    const token = await getTokenFromAsset(feeAsset);
    if (!token || blacklistedTokenIds.includes(token.id)) continue;

    const asset = getAssetFromToken(token, address);
    const assetReference = asset && "assetReference" in asset ? asset.assetReference : undefined;
    const assetOwner = asset && "assetOwner" in asset ? asset.assetOwner : undefined;
    if (!asset || !assetReference || !assetOwner) {
      log("generic-coin-framework", "fee token has no asset reference and owner", {
        hash: source.hash,
        tokenId: token.id,
      });
      continue;
    }

    const fee = new BigNumber(source.extra.feeAmount);
    const operation: OperationCommon = {
      id: encodeOperationId(source.accountId, source.hash, "FEES"),
      hash: source.hash,
      accountId: source.accountId,
      type: "FEES",
      value: fee,
      fee,
      blockHash: source.blockHash,
      blockHeight: source.blockHeight,
      senders: [address],
      recipients: [],
      date: source.date,
      transactionSequenceNumber: source.transactionSequenceNumber,
      hasFailed: source.hasFailed,
      extra: {
        ledgerOpType: "FEES",
        assetReference,
        assetOwner,
        feeAsset,
        feeAmount: source.extra.feeAmount,
        feePayer: source.extra.feePayer,
      },
    };
    result.push({ operation, asset });
  }
  return result;
}
