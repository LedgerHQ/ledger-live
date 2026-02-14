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

interface AccountIdentifier {
  account_identifier: {
    address: string;
    metadata: {
      token_id: string;
    };
  };
}

interface Operation {
  operation_identifier: { index: number };
  type: string;
  account: {
    address: string;
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
    delegate_change_target?: string;
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
export const buildAccountIdentifier = (address: string): AccountIdentifier => {
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
  from: string,
  to: string,
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
      makeOperation({
        idx: 0,
        relatedIdxs: [],
        opType: "fee_payment",
        addr: from,
        value: feeNano,
        isPositive: false,
      }),
      makeOperation({
        idx: 1,
        relatedIdxs: [],
        opType: "delegate_change",
        addr: from,
        value: 0,
        isPositive: true,
        isStake: true,
        to,
      }),
    ],
  };
}

interface MakeOperationOptions {
  idx: number;
  relatedIdxs: number[];
  opType: string;
  addr: string;
  value: number;
  isPositive: boolean;
  isStake?: boolean;
  to?: string;
}

/**
 * Creates an operation object for Rosetta API
 * @param options - Operation configuration options
 * @returns Operation object
 */
function makeOperation(options: MakeOperationOptions): Operation {
  const { idx, relatedIdxs, opType, addr, value, isPositive, isStake = false, to } = options;
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

  const metadata: Operation["metadata"] = {};
  if (to) {
    metadata.delegate_change_target = to;
  }

  return {
    ...baseOperation,
    metadata,
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
  from: string,
  to: string,
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
      makeOperation({
        idx: 0,
        relatedIdxs: [],
        opType: "fee_payment",
        addr: from,
        value: feeNano,
        isPositive: false,
      }),
      makeOperation({
        idx: 1,
        relatedIdxs: [],
        opType: "payment_source_dec",
        addr: from,
        value: valueNano,
        isPositive: false,
      }),
      makeOperation({
        idx: 2,
        relatedIdxs: [1],
        opType: "payment_receiver_inc",
        addr: to,
        value: valueNano,
        isPositive: true,
      }),
    ],
  };
}
