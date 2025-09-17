import { ethers } from "ethers";
import type { OperationType } from "@ledgerhq/types-live";
import type { StakingOperation } from "../types/staking";
import { STAKING_CONTRACTS } from "./contracts";

const OP_MAP: Partial<Record<StakingOperation, OperationType>> = {
  delegate: "DELEGATE",
  undelegate: "UNDELEGATE",
  redelegate: "REDELEGATE",
};

/**
 * Builds a map of 4-byte selectors to OperationType for a staking currency.
 */
const getStakingMethodSelectors = (
  currencyId: string,
): Record<string, OperationType> | undefined => {
  const config = STAKING_CONTRACTS[currencyId];
  if (!config) return undefined;

  const selectors: Record<string, OperationType> = {};

  for (const [op, fn] of Object.entries(config.functions)) {
    const operation = op as StakingOperation;
    const mapped = OP_MAP[operation];
    if (!mapped || !fn) continue; // only map delegate/undelegate/redelegate

    try {
      // calculate selector (first 4 bytes of the keccak256 hash)
      const selector = ethers.id(fn).slice(0, 10).toLowerCase();
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
