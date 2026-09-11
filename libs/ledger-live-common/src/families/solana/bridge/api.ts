import type { AssetInfo, TxData } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  BridgeApi,
  OptimisticOperationDescriptor,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { getChainAPI } from "@ledgerhq/coin-solana/network/index";
import { endpointByCurrencyId } from "@ledgerhq/coin-solana/utils";
import { getTokenAccountShapes } from "@ledgerhq/coin-solana/logic/tokenAccountShapes";
import { getCurrencyConfiguration } from "../../../config";
import type { SolanaCoinConfig } from "@ledgerhq/coin-solana/config";
import type { SolanaTxData } from "../types";

export async function getTokenFromAsset(
  currency: CryptoCurrency,
  asset: AssetInfo,
): Promise<TokenCurrency | undefined> {
  if (asset.type === "native" || !("assetReference" in asset) || !asset.assetReference) {
    return undefined;
  }
  return getCryptoAssetsStore().findTokenByAddressInCurrency(asset.assetReference, currency.id);
}

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: token.tokenType,
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

export function computeIntentType(transaction: Record<string, unknown>): string {
  const mode = transaction.mode as string | undefined;

  switch (mode) {
    case "send":
    case undefined:
      return "send";
    case "stake":
      return "stake.createAccount";
    case "delegate":
      return "stake.delegate";
    case "undelegate":
      return "stake.undelegate";
    case "unstake":
      return "stake.withdraw";
    case "opt-in":
      return "token.createATA";
    case "approve":
      return "token.approve";
    case "revoke":
      return "token.revoke";
    case "split":
      return "stake.split";
    default:
      throw new Error(`Unsupported Solana transaction mode: ${mode}`);
  }
}

/**
 * Carries a transaction a partner already built (`raw`) to the coin module. Without it the generic
 * bridge crafts from the intent and signs a plain transfer in place of the partner's bytes.
 */
export function buildIntentData(transaction: Record<string, unknown>): TxData {
  const { raw, templateId, familySpecificData } = transaction as {
    raw?: string;
    templateId?: string;
    familySpecificData?: { stakeAccountSeed?: string };
  };
  const { stakeAccountSeed } = familySpecificData ?? {};
  if (!raw && !stakeAccountSeed) return { type: "none" };
  const data: SolanaTxData = {
    type: "solana",
    ...(raw ? { raw } : {}),
    ...(templateId ? { templateId } : {}),
    ...(stakeAccountSeed ? { stakeAccountSeed } : {}),
  };
  return data;
}

const STAKING_OPERATION_TYPES: Record<string, OperationType> = {
  "opt-in": "OPT_IN",
  stake: "DELEGATE",
  delegate: "DELEGATE",
  undelegate: "UNDELEGATE",
  unstake: "WITHDRAW_UNBONDED",
  split: "FEES",
  approve: "FEES",
  revoke: "FEES",
};

export function describeOptimisticOperation(
  mode: string,
  _account: Account,
  transaction: Record<string, unknown>,
): OptimisticOperationDescriptor | undefined {
  const type = STAKING_OPERATION_TYPES[mode];
  if (!type) return undefined;
  const fees = transaction.fees as BigNumber | null | undefined;
  return { type, value: fees ?? new BigNumber(0) };
}

async function buildTokenAccountShapes(currency: CryptoCurrency, address: string) {
  try {
    const config = getCurrencyConfiguration<SolanaCoinConfig>(currency.id);
    const api = getChainAPI({ endpoint: endpointByCurrencyId(config, currency.id) });
    return await getTokenAccountShapes(api, address);
  } catch {
    return {};
  }
}

/**
 * `templateId` is the only switch that makes the Solana signer kit classify a partner-built
 * transaction as a swap and fetch its clear-sign template.
 */
export function getDeviceSignOptions(
  transaction: Record<string, unknown>,
  _account: Account,
): Record<string, unknown> | undefined {
  const { templateId } = transaction as { templateId?: string };
  return templateId ? { templateId } : undefined;
}

export default function solanaBridge(currency: CryptoCurrency): BridgeApi {
  return {
    stakingSupported: true,
    getTokenFromAsset: async (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    computeIntentType: (transaction: Record<string, unknown>) => computeIntentType(transaction),
    buildIntentData,
    buildTokenAccountShapes: (address: string) => buildTokenAccountShapes(currency, address),
    describeOptimisticOperation,
    getDeviceSignOptions,
  };
}
