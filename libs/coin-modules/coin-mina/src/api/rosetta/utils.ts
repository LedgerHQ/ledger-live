import {
  MINA_DECIMALS,
  MINA_SYMBOL,
  MINA_TOKEN_ID,
  MAINNET_NETWORK_IDENTIFIER,
} from "../../consts";

// Types for better type safety
type NetworkIdentifier = typeof MAINNET_NETWORK_IDENTIFIER;
export const addNetworkIdentifier = <T extends object>(data: T): T & NetworkIdentifier => {
  return {
    ...MAINNET_NETWORK_IDENTIFIER,
    ...data,
  };
};

type Address = string;

interface AccountIdentifier {
  account_identifier: {
    address: Address;
    metadata: {
      token_id: string;
    };
  };
}

interface Operation {
  operation_identifier: { index: number };
  type: string;
  account: {
    address: Address;
    metadata: {
      token_id: string;
    };
  };
  amount?: {
    value: string;
    currency: {
      symbol: string;
      decimals: number;
    };
  };
  metadata?: {
    delegate_change_target?: string | undefined;
  };
  related_operations?: Array<{ index: number }>;
}

interface TransactionPayload {
  operations: Operation[];
}

/**
 * Builds an account identifier object for Rosetta API
 * @param address - The account address
 * @returns Account identifier object
 */
export const buildAccountIdentifier = (address: Address): AccountIdentifier => {
  if (!address) {
    throw new Error("Address is required");
  }

  return {
    account_identifier: {
      address,
      metadata: {
        token_id: MINA_TOKEN_ID,
      },
    },
  };
};

/**
 * Creates a delegate change payload for Rosetta API
 * @param from - Source address
 * @param to - Delegate target address
 * @param feeNano - Fee amount in nano
 * @returns Transaction payload for delegate change
 */
export function makeDelegateChangePayload(
  from: Address,
  to: Address,
  feeNano: number,
): TransactionPayload {
  if (!from || !to) {
    throw new Error("Both from and to addresses are required");
  }
  if (feeNano < 0) {
    throw new Error("Fee cannot be negative");
  }

  return {
    operations: [
      makeOperation(0, [], "fee_payment", from, feeNano, false),
      makeOperation(1, [], "delegate_change", from, 0, true, true, to),
    ],
  };
}

/**
 * Creates an operation object for Rosetta API
 * @param idx - Operation index
 * @param relatedIdxs - Related operation indices
 * @param opType - Operation type
 * @param addr - Address
 * @param value - Operation value
 * @param isPositive - Whether the value is positive
 * @param isStake - Whether this is a staking operation
 * @param to - Target address for delegate change
 * @returns Operation object
 */
function makeOperation(
  idx: number,
  relatedIdxs: number[],
  opType: string,
  addr: Address,
  value: number,
  isPositive: boolean,
  isStake = false,
  to?: Address,
): Operation {
  if (!addr) {
    throw new Error("Address is required");
  }
  if (value < 0) {
    throw new Error("Value cannot be negative");
  }
  if (isStake && !to) {
    throw new Error("Target address is required for delegate change");
  }

  const relatedOps =
    relatedIdxs.length > 0
      ? {
          related_operations: relatedIdxs.map(i => ({ index: i })),
        }
      : {};

  const baseOperation: Operation = {
    operation_identifier: { index: idx },
    ...relatedOps,
    type: opType,
    account: {
      address: addr,
      metadata: {
        token_id: MINA_TOKEN_ID,
      },
    },
  };

  if (!isStake) {
    return {
      ...baseOperation,
      amount: {
        value: `${isPositive ? "" : "-"}${value}`,
        currency: {
          symbol: MINA_SYMBOL,
          decimals: MINA_DECIMALS,
        },
      },
    };
  }

  return {
    ...baseOperation,
    metadata: {
      delegate_change_target: to,
    },
  };
}

/**
 * Creates a transfer payload for Rosetta API
 * @param from - Source address
 * @param to - Target address
 * @param feeNano - Fee amount in nano
 * @param valueNano - Transfer amount in nano
 * @returns Transaction payload for transfer
 */
export function makeTransferPayload(
  from: Address,
  to: Address,
  feeNano: number,
  valueNano: number,
): TransactionPayload {
  if (!from || !to) {
    throw new Error("Both from and to addresses are required");
  }
  if (feeNano < 0 || valueNano < 0) {
    throw new Error("Fee and value cannot be negative");
  }

  return {
    operations: [
      makeOperation(0, [], "fee_payment", from, feeNano, false),
      makeOperation(1, [], "payment_source_dec", from, valueNano, false),
      makeOperation(2, [1], "payment_receiver_inc", to, valueNano, true),
    ],
  };
}
