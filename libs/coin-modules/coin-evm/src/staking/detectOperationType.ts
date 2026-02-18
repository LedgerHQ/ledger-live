import type { OperationType } from "@ledgerhq/types-live";
import { ethers } from "ethers";
import type { StakingOperation } from "../types/staking";
import { getStakingABI } from "./abis";
import { STAKING_CONTRACTS } from "./contracts";

const OP_MAP: Partial<Record<StakingOperation, OperationType>> = {
  delegate: "DELEGATE",
  undelegate: "UNDELEGATE",
  redelegate: "REDELEGATE",
};

/**
 * Checks if a string is a valid staking operation
 */
export function isStakingOperation(value: string): value is StakingOperation {
  const stakingOperations: ReadonlyArray<StakingOperation> = [
    "delegate",
    "undelegate",
    "redelegate",
    "getStakedBalance",
    "getUnstakedBalance",
  ];
  return stakingOperations.includes(value as StakingOperation);
}

/**
 * Builds a map of 4-byte selectors to OperationType for a staking currency.
 */
const getStakingMethodSelectors = (
  currencyId: string,
): Record<string, OperationType> | undefined => {
  const config = STAKING_CONTRACTS[currencyId];
  const abi = getStakingABI(currencyId);
  if (!config || !abi) return undefined;

  const selectors: Record<string, OperationType> = {};

  for (const [op, fn] of Object.entries(config.functions)) {
    const operation = op as StakingOperation;
    const mapped = OP_MAP[operation];
    if (!mapped || !fn) continue; // only map delegate/undelegate/redelegate

    try {
      // Find the appropriate function in the ABI by the name
      const abiFunction = abi.find(item => item.type === "function" && item.name === fn);
      if (!abiFunction) continue;

      // Build the complete function signature from ABI
      const inputs = abiFunction.inputs || [];
      const paramTypes = inputs.map(input => input.type).join(",");
      const signature = `${fn}(${paramTypes})`;
      // calculate selector (first 4 bytes of the keccak256 hash)
      const selector = ethers.id(signature).slice(0, 10).toLowerCase();
      selectors[selector] = mapped;
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

  const config = STAKING_CONTRACTS[currencyId];
  if (!config?.contractAddress) return undefined;

  if (config.contractAddress.toLowerCase() !== to.toLowerCase()) return undefined;

  const selectors = getStakingMethodSelectors(currencyId);
  if (!selectors) return undefined;

  return selectors[methodId.toLowerCase()];
};
