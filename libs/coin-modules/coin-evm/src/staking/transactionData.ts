import type {
  TransactionIntent,
  MemoNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
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
  currency: CryptoCurrency,
  intent: TransactionIntent<MemoNotSupported>,
): {
  to: string;
  data: Buffer;
  value: bigint;
} {
  if (!isStakingIntent(intent)) {
    throw new Error("Intent must be a staking intent");
  }

  const { amount, sender, mode, valAddress, valId, dstValAddress, withdrawId } = intent;

  const config = STAKING_CONTRACTS[currency.id];
  if (!config) {
    throw new Error(`Unsupported staking currency: ${currency.id}`);
  }

  if (!mode || !isStakingOperation(mode)) {
    throw new Error(`Invalid staking operation: ${mode}`);
  }

  const stakingParams = buildTransactionParams(currency.id, mode, {
    valAddress,
    valId,
    amount,
    dstValAddress,
    delegator: sender,
    withdrawId,
  });

  const to = config.specificContractAddressByOperation?.[mode] ?? config.contractAddress;
  const data = Buffer.from(
    encodeStakingData({
      currencyId: currency.id,
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

  const value = isPayable(currency.id, functionName) ? amount : 0n;

  return { to, data, value };
}
