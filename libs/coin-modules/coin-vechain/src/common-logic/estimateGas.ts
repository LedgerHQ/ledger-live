import { TransactionClause } from "@vechain/sdk-core";
import { getThorClient } from "./getThorClient";
import { EstimateGasResult } from "@vechain/sdk-network";
import type { VechainCurrencyConfig } from "../config";

/**
 * Estimates gas fees for transaction clauses
 * @param {TransactionClause[]} clauses - Array of transaction clauses
 * @param {string} origin - Origin address for the transaction
 * @return {Promise<EstimateGasResult>} Estimated gas result
 */
export const estimateGas = async (
  config: VechainCurrencyConfig,
  clauses: TransactionClause[],
  origin: string,
): Promise<EstimateGasResult> => {
  const thorClient = getThorClient(config);
  const gasResult = await thorClient.gas.estimateGas(clauses, origin);
  return gasResult;
};
