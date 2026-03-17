import {
  AlpacaApi,
  AssetInfo,
  Balance,
  BroadcastConfig,
  Cursor,
  FeeEstimation,
  ListOperationsOptions,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import coinConfig, { SolanaCoinConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { combine } from "../logic/combine";
import { craftRawTransaction } from "../logic/craftRawTransaction";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getBalance } from "../logic/getBalance";
import { getNextSequence } from "../logic/getNextSequence";
import { getAssetFromToken, getTokenFromAsset } from "../logic/getTokenFromAsset";
import { lastBlock } from "../logic/lastBlock";
import { listOperations } from "../logic/listOperations";
import { validateAddress } from "../logic/validateAddress";
import { validateIntent } from "../logic/validateIntent";
import { getChainAPI } from "../network";
import { endpointByCurrencyId } from "../utils";

export function createApi(config: SolanaCoinConfig, currencyId: string): AlpacaApi & BridgeApi {
  coinConfig.setCoinConfig(() => ({
    ...config,
    status: { type: "active" as const },
  }));
  const api = getChainAPI({ endpoint: endpointByCurrencyId(currencyId) });

  return {
    broadcast: (tx: string, _broadcastConfig?: BroadcastConfig) => {
      return broadcast(api, tx);
    },
    combine: (tx: string, signature: string, _pubkey?: string) => {
      return combine(tx, signature);
    },
    craftTransaction: (intent: TransactionIntent, customFees?: FeeEstimation) => {
      return craftTransaction(api, intent, customFees);
    },
    craftRawTransaction: (tx: string, sender: string, _publicKey: string, _sequence: bigint) => {
      return craftRawTransaction(tx, sender);
    },
    estimateFees: (
      intent: TransactionIntent,
      customFeesParameters?: FeeEstimation["parameters"],
    ) => {
      return estimateFees(api, intent, customFeesParameters);
    },
    getBalance: (address: string) => {
      return getBalance(api, address, {
        token2022Enabled: config.token2022Enabled,
      });
    },
    lastBlock: () => {
      return lastBlock(api);
    },
    listOperations: (_address: string, _options: ListOperationsOptions) => {
      return listOperations(api, _address, _options);
    },
    getBlock: () => {
      throw new Error("getBlock is not supported");
    },
    getBlockInfo: () => {
      throw new Error("getBlockInfo is not supported");
    },
    getRewards: (_address: string, _cursor?: Cursor) => {
      throw new Error("getRewards is not supported");
    },
    getValidators: () => {
      throw new Error("getValidators is not supported");
    },
    getStakes: (_address: string, _cursor?: Cursor) => {
      throw new Error("getStakes is not supported");
    },
    validateIntent: (
      intent: TransactionIntent,
      balances: Balance[],
      customFees?: FeeEstimation,
    ) => {
      return validateIntent(intent, balances, customFees);
    },
    getNextSequence: (address: string) => {
      return getNextSequence(api, address);
    },
    validateAddress: (address: string, parameters) => {
      return validateAddress(address, parameters);
    },
    getTokenFromAsset: (asset: AssetInfo) => {
      return getTokenFromAsset(currencyId, asset);
    },
    getAssetFromToken: (token, owner) => {
      return getAssetFromToken(token, owner);
    },
  };
}
