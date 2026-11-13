import BigNumber from "bignumber.js";
import type { AccountInfo, AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { XrpAccountInfo, XrpTxData } from "@ledgerhq/coin-xrp/types";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { getXrpEnabledTokenStandards } from "../config";
import { heldXrpTokenIds } from "../tokenHolding";
import type { XrpTokenResources } from "../types";

export const IOU_HEX_CODE = /^[0-9A-F]{40}$/;
const MPT_ISSUANCE_ID = /^[0-9A-F]{48}$/;

export function getStandardFromReference(assetReference: string): string | undefined {
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
        token.tokenType === "iou" && typeof limit === "bigint"
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
 * A `changeTrust` amount is a trust limit, not XRP: the pending row records 0. On a held token it
 * is an `OPT_EDIT`: a pending row whose type differs from the synced one changes its operation id.
 */
export function describeOptimisticOperation(
  mode: string,
  account: Account,
  transaction: Record<string, unknown>,
): OptimisticOperationDescriptor | undefined {
  if (mode !== "changeTrust") return undefined;

  const { assetReference, assetOwner } = transaction;
  const heldTokenIds = heldXrpTokenIds(account);
  const isHeld = (account.subAccounts ?? []).some(sub => {
    return heldTokenIds.has(sub.token.id) && isTokenOfAsset(sub.token, assetReference, assetOwner);
  });

  return { type: isHeld ? "OPT_EDIT" : "OPT_IN", value: new BigNumber(0) };
}

// A TrustSet blocks rippling unless the transaction asks for it: a missing choice keeps it blocked
export function buildIntentData(transaction: Record<string, unknown>): XrpTxData {
  if (transaction.mode !== "changeTrust") return { type: "none" };

  return { type: "changeTrust", noRipple: transaction.noRipple !== false };
}

export default function xrpBridgeApi(currency: CryptoCurrency): BridgeApi {
  const enabledStandards = getXrpEnabledTokenStandards(currency.id);

  return {
    getAssetFromToken,
    buildIntentData,
    describeOptimisticOperation,
    balanceListsEveryToken: true,
    exactAssetMatch: true,
    tokenOptParentRow: enabledStandards.length > 0,
    getTokenFromAsset: asset => getTokenFromAsset(currency, asset),
    buildTokenAccountShapes: address => buildTokenAccountShapes(currency, address),
    // Turning a standard on or off resyncs from scratch, to build its token accounts' history
    ...(enabledStandards.length > 0 && { syncVersion: enabledStandards.join(",") }),
  };
}
