// ─── api ──────────────────────────────────────────────────────────────────────
import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi, ChainSpecificRules } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getCurrencyConfiguration } from "../../../config";

// ─── bridge ───────────────────────────────────────────────────────────────────
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { StellarBurnAddressError } from "@ledgerhq/coin-stellar/types";
import { STELLAR_BURN_ADDRESS } from "@ledgerhq/coin-stellar/logic";

// ─── signer ───────────────────────────────────────────────────────────────────
import resolver from "../../../families/stellar/getAddress";
import { CreateSigner, executeWithSigner } from "../../setup";
import type { AlpacaSigner } from "../types";
import Transport from "@ledgerhq/hw-transport";
import Stellar from "@ledgerhq/hw-app-str";
import { StrKey } from "@stellar/stellar-sdk";

export function createApi(currencyId: string): AlpacaApi<any> & BridgeApi {
  return createStellarApi(
    getCurrencyConfiguration<StellarCoinConfig>(currencyId),
  ) as AlpacaApi<any> & BridgeApi;
}

export function getChainSpecificRules(): ChainSpecificRules {
  return {
    getAccountShape: (address: string) => {
      if (address === STELLAR_BURN_ADDRESS) {
        throw new StellarBurnAddressError();
      }
    },
    getTransactionStatus: {
      throwIfPendingOperation: true,
    },
  };
}

export async function getTokenFromAsset(asset: AssetInfo): Promise<TokenCurrency | undefined> {
  const assetId =
    asset.type !== "native" && "assetReference" in asset && "assetOwner" in asset
      ? `${asset.assetReference}:${asset.assetOwner}`
      : "";
  return await getCryptoAssetsStore().findTokenById(`stellar/asset/${assetId}`);
}

export function getAssetFromToken(token: TokenCurrency): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: token.name,
    assetOwner: token.contractAddress,
    name: token.name,
    unit: token.units[0],
  };
}

export const bridge = {
  getTokenFromAsset,
  getAssetFromToken,
  getChainSpecificRules,
} satisfies BridgeApi;

type StellarSigner = Stellar & {
  signTransaction: (path: string, transaction: string) => Promise<string>;
  getAddress: (
    path: string,
    options?: boolean | { verify?: boolean; derivationMode?: string },
  ) => Promise<{ path: string; address: string; publicKey: string }>;
};

export const createSignerStellar: CreateSigner<StellarSigner> = (transport: Transport) => {
  const stellar = new Stellar(transport);
  const originalSignTransaction = stellar.signTransaction;
  return Object.assign(stellar, {
    signTransaction: async (path: string, transaction: string) => {
      const unsignedPayload: Buffer = Buffer.from(transaction, "base64");
      const { signature } = await originalSignTransaction(path, unsignedPayload);
      return signature.toString("base64");
    },
    getAddress: async (path: string, options?: boolean | { verify?: boolean }) => {
      const verify = typeof options === "boolean" ? options : options?.verify;
      const { rawPublicKey } = await stellar.getPublicKey(path, !!verify);
      const publicKey = StrKey.encodeEd25519PublicKey(rawPublicKey);
      return { path, address: publicKey, publicKey };
    },
  });
};

export const context = executeWithSigner(createSignerStellar);

export const signer = {
  context,
  getAddress: resolver(context),
} satisfies AlpacaSigner;
