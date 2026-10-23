import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getXrpEnabledTokenStandards } from "../config";

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
    name: token.name,
    unit: token.units[0],
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

const xrpBridgeApi = (currency: CryptoCurrency): BridgeApi => {
  return {
    getAssetFromToken,
    getDeviceSignOptions,
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    exactAssetMatch: true,
  };
};

export default xrpBridgeApi;
