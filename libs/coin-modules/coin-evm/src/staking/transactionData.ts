import type { TransactionIntent, MemoNotSupported } from "@ledgerhq/coin-framework/api/index";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { StakingOperation } from "../types/staking";
import { isStakingIntent } from "../utils";
import { isPayable } from "./abis";
import { STAKING_CONTRACTS } from "./contracts";
import { isStakingOperation } from "./detectOperationType";
import { encodeStakingData } from "./encoder";

type OperationFn = (
  valAddress: string,
  amount: bigint,
  dstValAddress?: string,
  delegator?: string,
) => unknown[];

const STAKING_PROTOCOLS: Record<string, Record<string, OperationFn>> = {
  sei_evm: {
    delegate: valAddress => [valAddress],
    undelegate: (valAddress, amount) => [valAddress, amount],
    redelegate: (valAddress, amount, dstValAddress) => {
      if (!dstValAddress) throw new Error("SEI redelegate requires dstValAddress");
      return [valAddress, dstValAddress, amount];
    },
    getStakedBalance: (_recipient, _amount, dstValAddress, delegator) => {
      if (!delegator || !dstValAddress) {
        throw new Error("SEI getStakedBalance requires delegator and dstValAddress");
      }
      return [delegator, dstValAddress];
    },
  },
  celo: {
    delegate: (valAddress, amount) => [valAddress, amount],
    undelegate: (valAddress, amount) => [valAddress, amount],
    redelegate: () => {
      throw new Error("Celo does not support redelegate");
    },
    getStakedBalance: valAddress => [valAddress],
    getUnstakedBalance: valAddress => [valAddress],
  },
};

export const buildTransactionParams = (
  currencyId: string,
  transactionType: StakingOperation,
  valAddress: string,
  amount: bigint,
  dstValAddress?: string,
  delegator?: string,
): unknown[] => {
  const protocol = STAKING_PROTOCOLS[currencyId];
  if (!protocol) {
    throw new Error(`Unsupported staking currency: ${currencyId}`);
  }

  const operation = protocol[transactionType];
  if (!operation) {
    throw new Error(`Unsupported transaction type for ${currencyId}: ${transactionType}`);
  }
  return operation(valAddress, amount, dstValAddress, delegator);
};

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

  const { amount, sender, mode, valAddress, dstValAddress } = intent;

  const config = STAKING_CONTRACTS[currency.id];
  if (!config) {
    throw new Error(`Unsupported staking currency: ${currency.id}`);
  }

  if (!mode || !isStakingOperation(mode)) {
    throw new Error(`Invalid staking operation: ${mode}`);
  }

  const stakingParams = buildTransactionParams(
    currency.id,
    mode,
    valAddress,
    amount,
    dstValAddress, // dstValAddress for redelegate
    sender, // delegator address
  );

  const to = config.contractAddress;
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
