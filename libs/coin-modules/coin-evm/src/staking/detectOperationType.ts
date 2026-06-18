import type { OperationType } from "@ledgerhq/types-live";
import { ethers } from "ethers";
import type { StakingOperation } from "../types/staking";
import { getStakingABI } from "./abis";
import { STAKING_CONTRACTS } from "./contracts";

const OP_MAP: Partial<Record<StakingOperation, OperationType>> = {
  delegate: "DELEGATE",
  undelegate: "UNDELEGATE",
  redelegate: "REDELEGATE",
  withdraw: "WITHDRAW_UNBONDED",
  claimReward: "REWARD",
  compoundReward: "REWARD",
};

/**
 * Checks if a string is a valid staking operation
 */
export function isStakingOperation(value: string): value is StakingOperation {
  const stakingOperations: ReadonlyArray<StakingOperation> = [
    "delegate",
    "undelegate",
    "redelegate",
    "withdraw",
    "getStakedBalance",
    "getUnstakedBalance",
    "claimReward",
    "compoundReward",
  ];
  return stakingOperations.includes(value as StakingOperation);
}

/**
 * Builds a map of `(to, 4-byte selector)` pairs to OperationType for a staking currency.
 * Some chains (e.g. SEI) route specific operations to dedicated precompiles
 * (`specificContractAddressByOperation`) instead of the main staking contract.
 * Cached per `currencyId` since inputs are static (config + ABI files).
 */
const selectorsCache = new Map<string, Map<string, OperationType>>();
const getStakingMethodSelectors = (currencyId: string): Map<string, OperationType> | undefined => {
  const cached = selectorsCache.get(currencyId);
  if (cached) return cached;

  const config = STAKING_CONTRACTS[currencyId];
  const abi = getStakingABI(currencyId);
  if (!config?.contractAddress || !abi) return undefined;

  const selectors = new Map<string, OperationType>();
  selectorsCache.set(currencyId, selectors);
  const key = (to: string, selector: string): string =>
    `${to.toLowerCase()}|${selector.toLowerCase()}`;

  for (const [op, fn] of Object.entries(config.functions)) {
    const operation = op as StakingOperation;
    const mapped = OP_MAP[operation];
    if (!mapped || !fn) continue;

    try {
      // Find the appropriate function in the ABI by the name
      const abiFunction = abi.find(item => item.type === "function" && item.name === fn);
      if (!abiFunction) continue;

      // Build the complete function signature from ABI
      const inputs = abiFunction.inputs || [];
      const paramTypes = inputs.map(input => input.type).join(",");
      const signature = `${fn}(${paramTypes})`;
      // calculate selector (first 4 bytes of the keccak256 hash)
      const selector = ethers.id(signature).slice(0, 10);
      const opContractAddress =
        config.specificContractAddressByOperation?.[operation] ?? config.contractAddress;
      selectors.set(key(opContractAddress, selector), mapped);
    } catch {
      // ignore if function not in ABI or malformed
      continue;
    }
  }

  return selectors;
};

export const detectEvmStakingOperationType = (
  currencyId: string,
  to: string | undefined | null,
  methodId: string | undefined | null,
): OperationType | undefined => {
  if (!to || !methodId) return undefined;

  const selectors = getStakingMethodSelectors(currencyId);
  if (!selectors) return undefined;

  return selectors.get(`${to.toLowerCase()}|${methodId.toLowerCase()}`);
};
