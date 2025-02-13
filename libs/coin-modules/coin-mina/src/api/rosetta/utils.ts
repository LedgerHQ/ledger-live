import {
  MINA_DECIMALS,
  MINA_SYMBOL,
  MINA_TOKEN_ID,
  MAINNET_NETWORK_IDENTIFIER,
} from "../../consts";

export const addNetworkIdentifier = (data: any) => {
  return {
    ...MAINNET_NETWORK_IDENTIFIER,
    ...data,
  };
};

export const buildAccountIdentifier = (address: string) => {
  return {
    account_identifier: {
      address,
      metadata: {
        token_id: MINA_TOKEN_ID,
      },
    },
  };
};

export function makeTransferPayload(from: string, to: string, feeNano: number, valueNano: number) {
  function makeOperation(
    idx: number,
    relatedIdxs: number[],
    opType: string,
    addr: string,
    value: number,
    isPositive: boolean,
  ) {
    const relatedOps =
      relatedIdxs.length == 0
        ? {}
        : {
            related_operations: relatedIdxs.map(i => {
              return { index: i };
            }),
          };

    return {
      operation_identifier: { index: idx },
      relatedOps,
      type: opType,
      account: {
        address: addr,
        metadata: {
          token_id: MINA_TOKEN_ID,
        },
      },
      amount: {
        value: (isPositive ? "" : "-") + value.toString(),
        currency: {
          symbol: MINA_SYMBOL,
          decimals: MINA_DECIMALS,
        },
      },
    };
  }

  return {
    operations: [
      makeOperation(0, [], "fee_payment", from, feeNano, false),
      makeOperation(1, [], "payment_source_dec", from, valueNano, false),
      makeOperation(2, [1], "payment_receiver_inc", to, valueNano, true),
    ],
  };
}
