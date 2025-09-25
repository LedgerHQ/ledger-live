import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AnyIntent } from "@ledgerhq/coin-framework/api/index";
import type { StakingOperation } from "../types/staking";
import { isNative } from "../types";
import { isStakingIntent } from "../utils";
import { STAKING_CONTRACTS } from "./contracts";
import { encodeStakingData } from "./encoder";
import { isStakingOperation } from "./detectOperationType";

type OperationFn = (
  recipient: string,
  amount: bigint,
  sourceValidator?: string,
  delegator?: string,
) => unknown[];

const STAKING_PROTOCOLS: Record<string, Record<string, OperationFn>> = {
  sei_network_evm: {
    delegate: recipient => [recipient],
    undelegate: (recipient, amount) => [recipient, amount],
    redelegate: (recipient, amount, sourceValidator) => {
      if (!sourceValidator) throw new Error("SEI redelegate requires sourceValidator");
      return [sourceValidator, recipient, amount];
    },
    getStakedBalance: (_recipient, _amount, sourceValidator, delegator) => {
      if (!delegator || !sourceValidator) {
        throw new Error("SEI getStakedBalance requires delegator and validator");
      }
      return [delegator, sourceValidator];
    },
  },
  celo: {
    delegate: (recipient, amount) => [recipient, amount],
    undelegate: (recipient, amount) => [recipient, amount],
    redelegate: () => {
      throw new Error("Celo does not support redelegate");
    },
    getStakedBalance: recipient => [recipient],
    getUnstakedBalance: recipient => [recipient],
  },
};

export const buildTransactionParams = (
  currencyId: string,
  transactionType: StakingOperation,
  recipient: string,
  amount: bigint,
  sourceValidator?: string,
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

  return operation(recipient, amount, sourceValidator, delegator);
};

/**
 * Builds transaction parameters for staking transactions
 */
export function buildStakingTransactionParams(
  currency: CryptoCurrency,
  intent: AnyIntent,
): {
  to: string;
  data: Buffer;
  value: bigint;
} {
  if (!isStakingIntent(intent)) {
    throw new Error("Intent must be a staking intent");
  }

  const { amount, asset, recipient, sender, mode, parameters } = intent;

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
    recipient,
    amount,
    parameters?.[0], // sourceValidator for redelegate
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
  const value = isNative(asset) ? amount : 0n;

  return { to, data, value };
}
