import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { TransactionTronAPI } from "./types";

/** A value a transaction's sender attaches to a smart contract call or creation. */
export type CallValue = {
  amount: bigint;
  /** The TRC10 token sent, when the value is not TRX. */
  tokenId?: string;
};

type ContractParameters = TransactionTronAPI["raw_data"]["contract"][number]["parameter"]["value"];

/**
 * The TRX (`call_value`, or the created contract's endowment) and the TRC10 (`call_token_value` of
 * `token_id`) a smart contract call or creation sends to its contract. It is the transaction's own
 * transfer, so the receipt's internal transactions do not list it, and a failed transaction refunds
 * it: the caller must not read it for one.
 */
export function readCallValues(
  logger: Logger,
  txID: string,
  type: string,
  params: ContractParameters,
): CallValue[] {
  const values: CallValue[] = [];
  const read = (amount: number | undefined, tokenId?: string) => {
    if (!amount) return;
    if (!Number.isSafeInteger(amount) || amount < 0) {
      logger("tron/callValue", "skipping a call value that cannot be read", { txID, amount });
      return;
    }
    values.push({ amount: BigInt(amount), ...(tokenId ? { tokenId } : {}) });
  };

  read(type === "CreateSmartContract" ? params.new_contract?.call_value : params.call_value);
  // Without a `token_id`, a `call_token_value` names no token.
  if (params.token_id) read(params.call_token_value, params.token_id.toString());
  return values;
}
