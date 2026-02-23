import type { Transaction as LiveTransaction } from "@ledgerhq/live-common/generated/types";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { BigNumber } from "bignumber.js";

function hasProp<K extends string>(obj: object, key: K): obj is Record<K, unknown> {
  return key in obj;
}

export function isEvmTransaction(tx: LiveTransaction): tx is EvmTransaction {
  if (tx.family !== "evm") return false;
  if (typeof tx !== "object" || tx === null) return false;

  if (!hasProp(tx, "type") || typeof tx.type !== "number") return false;
  if (!hasProp(tx, "nonce") || typeof tx.nonce !== "number") return false;
  if (!hasProp(tx, "chainId") || typeof tx.chainId !== "number") return false;
  if (!hasProp(tx, "gasLimit") || !BigNumber.isBigNumber(tx.gasLimit)) return false;
  if (!hasProp(tx, "mode") || typeof tx.mode !== "string") return false;

  return true;
}
