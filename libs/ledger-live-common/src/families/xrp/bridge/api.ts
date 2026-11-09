import { BigNumber } from "bignumber.js";
import type { AccountInfo, AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { XrpAccountInfo } from "@ledgerhq/coin-xrp/types";
import type { Account } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { getXrpEnabledTokenStandards } from "../config";
import type { XrpTokenResources } from "../types";

const IOU_HEX_CODE = /^[0-9A-F]{40}$/;
const MPT_ISSUANCE_ID = /^[0-9A-F]{48}$/;

function getStandardFromReference(assetReference: string): string | undefined {
  if (assetReference.length === 3 || IOU_HEX_CODE.test(assetReference)) return "iou";
  if (MPT_ISSUANCE_ID.test(assetReference)) return "mpt";

  return undefined;
}

// Typed with the domain token: the one on `TokenAccount` lacks `tokenIdentifier`
function isTokenOfAsset(token: TokenCurrency, assetReference: unknown, assetOwner: unknown) {
  return token.tokenIdentifier === assetReference && token.contractAddress === assetOwner;
}

/**
 * The CAL token with exactly this issuer and reference: XRPL addresses and currency codes are
 * case-sensitive, but the CAL matches an issuer in any case.
 */
export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (!("assetReference" in asset) || !asset.assetReference) return undefined;
  if (!("assetOwner" in asset) || !asset.assetOwner) return undefined;

  const { assetReference, assetOwner } = asset;

  // An intent or an operation built without a token account only knows the generic `"token"`
  const standard = asset.type === "token" ? getStandardFromReference(assetReference) : asset.type;

  const enabledStandards: string[] = getXrpEnabledTokenStandards(currency.id);
  if (!standard || !enabledStandards.includes(standard)) return undefined;

  const store = getCryptoAssetsStore();
  const token = await store.findTokenByAddressInCurrency(assetOwner, currency.id, assetReference);
  if (!token) return undefined;

  const isSameAsset = isTokenOfAsset(token, assetReference, assetOwner);

  return isSameAsset && token.tokenType === standard ? token : undefined;
}

/**
 * Not gated on the enabled standards: without an asset, a send from a stored token account falls
 * back to a native XRP send. coin-xrp refuses the intent of a standard that is not enabled.
 */
export function getAssetFromToken(token: TokenCurrency): AssetInfo | undefined {
  if (!token.tokenIdentifier) return undefined;

  return {
    type: token.tokenType,
    assetReference: token.tokenIdentifier,
    assetOwner: token.contractAddress,
  };
}

function isXrpAccountInfo(accountInfo: AccountInfo | undefined): accountInfo is XrpAccountInfo {
  return accountInfo?.type === "xrp";
}

/** Each held token's state, keyed by token id: one issuer can issue several tokens */
export async function buildTokenAccountShapes(
  currency: CryptoCurrency,
  address: string,
): Promise<Record<string, { xrpResources: XrpTokenResources }>> {
  if (getXrpEnabledTokenStandards(currency.id).length === 0) return {};

  const api = await getCoinModuleApi(currency.id, "local");
  const accountInfo = await api.getAccountInfo?.(buildContext(currency.id), address);
  if (!isXrpAccountInfo(accountInfo)) return {};

  const shapes = await Promise.all(
    accountInfo.tokens.map(async ({ asset, isLocked, limit, isRippling }) => {
      const token = await getTokenFromAsset(currency, asset);
      if (!token) return [];

      const xrpResources: XrpTokenResources =
        token.tokenType === "iou"
          ? {
              isLocked,
              isRippling,
              limit: new BigNumber(limit.toString()),
            }
          : { isLocked };

      return [[token.id, { xrpResources }] as const];
    }),
  );

  return Object.fromEntries(shapes.flat());
}

/**
 * A `changeTrust` amount is a trust limit, not XRP: the pending row records 0. It is an `OPT_IN`
 * even when it edits the limit of a held token, as sync records every own limit above 0.
 */
export function describeOptimisticOperation(
  mode: string,
): OptimisticOperationDescriptor | undefined {
  if (mode === "changeTrust") return { type: "OPT_IN", value: new BigNumber(0) };
  if (mode === "optOut") return { type: "OPT_OUT", value: new BigNumber(0) };

  return undefined;
}

// The default mapping knows no "optOut", and throws on it
export function computeIntentType(transaction: Record<string, unknown>): string {
  const { mode } = transaction;
  if (mode === undefined) return "Payment";
  if (mode === "send" || mode === "changeTrust" || mode === "optOut") return mode;

  throw new Error(`Unsupported transaction mode: ${JSON.stringify(mode)}`);
}

// TEMP prototype: sends MPT transactions to the MPT signer (families/xrp/signer.ts). An opt-in has
// no token account: its MPT issuance id is 48 hex characters, an IOU currency code 3 or 40.
const getDeviceSignOptions = (transaction: Record<string, unknown>, account: Account) => {
  const subAccount = account.subAccounts?.find(sub => sub.id === transaction.subAccountId);

  const isMptIssuanceId =
    typeof transaction.assetReference === "string" &&
    MPT_ISSUANCE_ID.test(transaction.assetReference);
  const isMpt = subAccount ? subAccount.token.tokenType === "mpt" : isMptIssuanceId;

  return isMpt ? { mptSigner: true } : undefined;
};

export default function xrpBridgeApi(currency: CryptoCurrency): BridgeApi {
  const enabledStandards = getXrpEnabledTokenStandards(currency.id);

  return {
    getAssetFromToken,
    computeIntentType,
    getDeviceSignOptions,
    exactAssetMatch: true,
    describeOptimisticOperation,
    balanceListsEveryToken: true,
    getTokenFromAsset: asset => getTokenFromAsset(currency, asset),
    buildTokenAccountShapes: address => buildTokenAccountShapes(currency, address),
    // Turning a standard on or off resyncs from scratch, to build its token accounts' history
    ...(enabledStandards.length > 0 && { syncVersion: enabledStandards.join(",") }),
  };
}
