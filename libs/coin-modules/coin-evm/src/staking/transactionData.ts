import type {
  TransactionIntent,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import { isStakingIntent } from "../utils";
import { isPayable } from "./abis";
import { STAKING_CONTRACTS } from "./contracts";
import { isStakingOperation } from "./detectOperationType";
import { encodeStakingData } from "./encoder";
import { buildTransactionParams } from "./operations";

/**
 * Builds transaction parameters for staking transactions
 */
export function buildStakingTransactionParams(
  currencyId: string,
  intent: TransactionIntent<MemoNotSupported>,
): {
  to: string;
  data: Buffer;
  value: bigint;
} {
  if (!isStakingIntent(intent)) {
    throw new Error("Intent must be a staking intent");
  }

  const { amount, sender, mode, valAddress, valId, dstValAddress, withdrawId, txValue, shares } =
    intent;

  const config = STAKING_CONTRACTS[currencyId];
  if (!config) {
    throw new Error(`Unsupported staking currency: ${currencyId}`);
  }

  if (!mode || !isStakingOperation(mode)) {
    throw new Error(`Invalid staking operation: ${mode}`);
  }

  const stakingParams = buildTransactionParams(currencyId, mode, {
    valAddress,
    valId,
    amount,
    dstValAddress,
    delegator: sender,
    withdrawId,
    shares,
  });

  const to = config.contractAddress({ mode, valAddress });
  const data = Buffer.from(
    encodeStakingData({
      currencyId,
      operation: mode,
      config,
      params: stakingParams,
    }).slice(2),
    "hex",
  );

  const functionName = config.functions[mode];
  if (!functionName) {
    throw new Error(`No function mapping found for the operation: ${mode}`);
  }

  const value = isPayable(currencyId, functionName)
    ? config.value({ mode, amount, ...(typeof txValue === "bigint" ? { txValue } : {}) })
    : 0n;

  return { to, data, value };
}
