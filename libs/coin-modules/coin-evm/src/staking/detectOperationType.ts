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

type SelectorEntry = {
  resolveAddress: (to: string) => string;
  opType: OperationType;
};

/**
 * Builds and caches, per currency, a selector → entry map derived from the staking ABI.
 * The cache is bounded — one entry per staking-enabled currency — regardless of how many
 * distinct `to` addresses appear in the tx history. A per-(currencyId, to) cache would
 * grow unboundedly for factory-per-validator chains like 0G, since
 * detectEvmStakingOperationType is called for every outgoing tx.
 *
 * At lookup time `resolveAddress` is called with the tx `to` to verify the tx targets the
 * expected contract for that operation. For static-precompile chains this resolves to a
 * constant; for factory-per-validator chains (e.g. 0G) the validator contract IS the tx
 * recipient, so `resolveAddress(to) === to` always holds when the selector matches.
 *
 * Address verification after the selector lookup guards against false positives: a tx with
 * a matching selector sent to the wrong contract (e.g. SEI claimReward selector hitting the
 * staking precompile instead of the distribution precompile) is not a staking operation.
 */
const selectorsCache = new Map<string, Map<string, SelectorEntry>>();
const getStakingEntries = (currencyId: string): Map<string, SelectorEntry> | undefined => {
  const cached = selectorsCache.get(currencyId);
  if (cached) return cached;

  const config = STAKING_CONTRACTS[currencyId];
  const abi = getStakingABI(currencyId);
  if (!config || !abi) return undefined;

  const entries = new Map<string, SelectorEntry>();
  selectorsCache.set(currencyId, entries);

  for (const [op, fn] of Object.entries(config.functions)) {
    const operation = op as StakingOperation;
    const mapped = OP_MAP[operation];
    if (!mapped || !fn) continue;

    try {
      const abiFunction = abi.find(item => item.type === "function" && item.name === fn);
      if (!abiFunction) continue;

      const inputs = abiFunction.inputs || [];
      const paramTypes = inputs.map(input => input.type).join(",");
      const signature = `${fn}(${paramTypes})`;
      const selector = ethers.id(signature).slice(0, 10).toLowerCase();
      entries.set(selector, {
        resolveAddress: to => config.contractAddress({ mode: operation, valAddress: to }),
        opType: mapped,
      });
    } catch {
      continue;
    }
  }

  return entries;
};

export const detectEvmStakingOperationType = (
  currencyId: string,
  to: string | undefined | null,
  methodId: string | undefined | null,
): OperationType | undefined => {
  if (!to || !methodId) return undefined;

  const entries = getStakingEntries(currencyId);
  if (!entries) return undefined;

  const entry = entries.get(methodId.toLowerCase());
  if (!entry) return undefined;

  try {
    return entry.resolveAddress(to).toLowerCase() === to.toLowerCase() ? entry.opType : undefined;
  } catch {
    return undefined;
  }
};
