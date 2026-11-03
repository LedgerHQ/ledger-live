import { BigNumber } from "bignumber.js";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getTokenStates } from "@ledgerhq/coin-xrp/logic-public";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { getXrpEnabledTokenStandards } from "../config";
import type { XrpTokenResources } from "../types";

// Same mapping as Stellar: issuer = contractAddress / assetOwner, currency code or MPT issuance id =
// tokenIdentifier / assetReference.
export const getTokenFromAsset = async (
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> => {
  const hasTokenFields = "assetReference" in asset && "assetOwner" in asset;
  if (asset.type === "native" || !hasTokenFields) return undefined;
  if (!asset.assetReference || !asset.assetOwner) return undefined;

  const store = getCryptoAssetsStore();
  const token = await store.findTokenByAddressInCurrency(
    asset.assetOwner,
    currency.id,
    asset.assetReference,
  );
  if (!token) return undefined;

  const enabledStandards = getXrpEnabledTokenStandards(currency);

  return enabledStandards.includes(token.tokenType) ? token : undefined;
};

const getAssetFromToken = (token: TokenCurrency): AssetInfo | undefined => {
  if (!token.tokenIdentifier) return undefined;

  return {
    type: token.tokenType,
    assetReference: token.tokenIdentifier,
    assetOwner: token.contractAddress,
  };
};

// TEMP prototype: sends MPT transactions to the MPT signer (families/xrp/signer.ts). An opt-in has
// no token account: its MPT issuance id is 48 hex characters, an IOU currency code 3 or 40.
const getDeviceSignOptions = (transaction: Record<string, unknown>, account: Account) => {
  const subAccount = account.subAccounts?.find(sub => sub.id === transaction.subAccountId);

  const isMptIssuanceId =
    typeof transaction.assetReference === "string" &&
    /^[0-9A-F]{48}$/i.test(transaction.assetReference);
  const isMpt = subAccount ? subAccount.token.tokenType === "mpt" : isMptIssuanceId;

  return isMpt ? { mptSigner: true } : undefined;
};

// An opt-in's amount is its trust limit in token base units, not XRP: as the pending row's value it
// would show as XRP and lock that much native balance. The sync records 0, so does the pending row
export const describeOptimisticOperation = (mode: string) => {
  if (mode === "changeTrust") return { value: new BigNumber(0) };
  if (mode === "optOut") return { type: "OPT_OUT" as const, value: new BigNumber(0) };

  return undefined;
};

// The default mapping knows no "optOut", and throws on it
export const computeIntentType = (transaction: Record<string, unknown>): string => {
  const { mode } = transaction;
  if (mode === undefined) return "Payment";
  if (mode === "send" || mode === "changeTrust" || mode === "optOut") return mode;

  throw new Error(`Unsupported transaction mode: ${JSON.stringify(mode)}`);
};

/**
 * Each held token's trust limit and lock, keyed by token id: one issuer can issue several tokens,
 * so its address, the tokens' contractAddress, does not tell them apart.
 *
 * A failure fails the sync rather than returning no shape: a token account without `xrpResources`
 * is one the account no longer holds. `getBalance` reads the same lines and MPTokens, and fails alike.
 */
export const buildTokenAccountShapes = async (currency: CryptoCurrency, address: string) => {
  const states = await getTokenStates(buildContext(currency.id), address);
  const shapes = await Promise.all(
    states.map(async ({ asset, isLocked, limit, isRippling }) => {
      const token = await getTokenFromAsset(currency, asset);
      const xrpResources: XrpTokenResources = {
        isLocked,
        ...(limit !== undefined && { limit: new BigNumber(limit.toString()) }),
        ...(isRippling !== undefined && { isRippling }),
      };

      return token ? [[token.id, { xrpResources }] as const] : [];
    }),
  );

  return Object.fromEntries(shapes.flat());
};

const xrpBridgeApi = (currency: CryptoCurrency): BridgeApi => {
  return {
    buildTokenAccountShapes: (address: string) => buildTokenAccountShapes(currency, address),
    computeIntentType,
    describeOptimisticOperation,
    getAssetFromToken,
    getDeviceSignOptions,
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    exactAssetMatch: true,
  };
};

export default xrpBridgeApi;
