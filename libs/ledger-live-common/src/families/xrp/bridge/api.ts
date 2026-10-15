import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";

// Same mapping as Stellar: issuer = contractAddress / assetOwner, currency code or MPT issuance id =
// tokenIdentifier / assetReference.
export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !("assetOwner" in asset)) {
    return undefined;
  }
  if (!asset.assetReference || !asset.assetOwner) return undefined;
  return getCryptoAssetsStore().findTokenByAddressInCurrency(
    asset.assetOwner,
    currency.id,
    asset.assetReference,
  );
}

export function getAssetFromToken(token: TokenCurrency): AssetInfo | undefined {
  if (!token.tokenIdentifier) return undefined;
  return {
    type: token.tokenType,
    assetReference: token.tokenIdentifier,
    assetOwner: token.contractAddress,
    name: token.name,
    unit: token.units[0],
  };
}

// TEMP prototype: sends MPT transactions to the MPT signer (families/xrp/signer.ts). An opt-in has
// no token account: its MPT issuance id is 48 hex characters, an IOU currency code 3 or 40.
function getDeviceSignOptions(transaction: Record<string, unknown>, account: Account) {
  const subAccount = account.subAccounts?.find(sub => sub.id === transaction.subAccountId);
  const isMpt = subAccount
    ? subAccount.token.tokenType === "mpt"
    : typeof transaction.assetReference === "string" &&
      /^[0-9A-F]{48}$/i.test(transaction.assetReference);
  return isMpt ? { mptSigner: true } : undefined;
}

export default function xrpBridgeApi(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken,
    getDeviceSignOptions,
  };
}
