import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { BigNumber } from "bignumber.js";
import { NearProtocolConfigNotLoaded } from "../errors";
import { getProtocolConfig } from "./node";

/**
 * Per-action gas costs and the storage price, derived from the protocol config.
 *
 * The account bridge gets these from preloaded data; callers that run outside a bridge sync (the
 * CoinModuleApi surface) have no preload step, so they read them here instead. Cached because the
 * protocol config only changes with a protocol upgrade.
 */
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
};

const fetchActionCosts = async (): Promise<NearActionCosts> => {
  const protocolConfig = await getProtocolConfig();

  if (!protocolConfig) {
    throw new NearProtocolConfigNotLoaded();
  }

  const { storage_amount_per_byte, transaction_costs } = protocolConfig.runtime_config;
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
  };
};

export const getActionCosts = makeLRUCache(fetchActionCosts, () => "", {
  ttl: 30 * 60 * 1000,
});
