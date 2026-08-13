import network from "@ledgerhq/live-network/network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { BigNumber } from "bignumber.js";
import { type NearConfig } from "../config";
import { NearProtocolConfigNotLoaded } from "../errors";
import type { NearProtocolConfig } from "./sdk.types";

// Lives here rather than in node.ts: fetchActionCosts is its only caller, and node.ts already
// imports getActionCosts from this module — importing back from node.ts would cycle the two files.
export const getProtocolConfig = async (config: NearConfig): Promise<NearProtocolConfig> => {
  const currencyConfig = config;
  const { data } = await network<{ result: NearProtocolConfig }>({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "EXPERIMENTAL_protocol_config",
      params: {
        finality: "final",
      },
    },
  });

  return data.result;
};

// Per-action gas costs and storage price, derived from the protocol config. The account bridge
// reads these from preload; callers outside a bridge sync (CoinModuleApi) have none, so this reads
// them directly — cached since the config only changes on a protocol upgrade.
export type NearActionCosts = {
  storageCost: BigNumber;
  createAccountCostSend: BigNumber;
  createAccountCostExecution: BigNumber;
  transferCostSend: BigNumber;
  transferCostExecution: BigNumber;
  addKeyCostSend: BigNumber;
  addKeyCostExecution: BigNumber;
  receiptCreationSend: BigNumber;
  receiptCreationExecution: BigNumber;
  /** Floor on the execution-half gas price (protocol 85+); 0 on older protocol versions. */
  minGasPurchasePrice: BigNumber;
  /** Yocto cost of activating a new account (protocol 85+); 0 on older protocol versions. */
  accountCreationCharge: BigNumber;
};

const fetchActionCosts = async (config: NearConfig): Promise<NearActionCosts> => {
  const protocolConfig = await getProtocolConfig(config);

  if (!protocolConfig) {
    throw new NearProtocolConfigNotLoaded();
  }

  const {
    storage_amount_per_byte,
    transaction_costs,
    min_gas_purchase_price,
    account_creation_charge,
  } = protocolConfig.runtime_config;
  const { action_creation_config, action_receipt_creation_config } = transaction_costs;

  return {
    storageCost: new BigNumber(storage_amount_per_byte),
    createAccountCostSend: new BigNumber(action_creation_config.create_account_cost.send_not_sir),
    createAccountCostExecution: new BigNumber(action_creation_config.create_account_cost.execution),
    transferCostSend: new BigNumber(action_creation_config.transfer_cost.send_not_sir),
    transferCostExecution: new BigNumber(action_creation_config.transfer_cost.execution),
    addKeyCostSend: new BigNumber(
      action_creation_config.add_key_cost.full_access_cost.send_not_sir,
    ),
    addKeyCostExecution: new BigNumber(
      action_creation_config.add_key_cost.full_access_cost.execution,
    ),
    receiptCreationSend: new BigNumber(action_receipt_creation_config.send_not_sir),
    receiptCreationExecution: new BigNumber(action_receipt_creation_config.execution),
    minGasPurchasePrice: new BigNumber(min_gas_purchase_price ?? 0),
    accountCreationCharge: new BigNumber(account_creation_charge ?? 0),
  };
};

export const getActionCosts = makeLRUCache(fetchActionCosts, () => "", {
  ttl: 30 * 60 * 1000,
});
