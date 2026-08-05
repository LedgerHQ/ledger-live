import type {
  StringMemo,
  MemoNotSupported,
  TxData,
} from "@ledgerhq/coin-module-framework/api/types";
import type { TronOperationMode, TronResource, Vote } from "./bridge";

/*
  TRC10 tokens use a standard implementation on the protocol level.
  They are identified by a tokenId and do not require a smart contract.

  Example:

  https://tronscan.org/#/token/1002000
  {
    standard: "trc10",
    tokenId: "1002000",
  }
*/
/*
  TRC20 tokens are smart contracts that implement the TRC20 interface.

  https://tronscan.org/#/token20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
  {
    standard: "trc20",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  }
*/

// Since memo is not always present and depends on transaction type (e.g. not allowed for TRC20):
export type TronMemo = MemoNotSupported | StringMemo<"memo">;

/**
 * Tron-specific transaction payload, supplied to the framework as the `TxDataType` generic of
 * `CoinModuleApi` / `TransactionIntent` and therefore reachable as `intent.data`.
 *
 * Resource staking (freeze / unfreeze / vote / …) needs two fields that no generic transaction
 * models: which resource to stake and the vote list. Per ADR-047 these stay local to coin-tron and
 * travel through the framework's TxData generic rather than widening `TransactionIntent` — nothing
 * Tron-specific is added to `coin-module-framework`.
 *
 * `type: "tron"` satisfies the framework's `TxData` discriminant. It is deliberately NOT the
 * transaction mode: the mode already lives on `intent.type`, and duplicating it here would create
 * two sources of truth.
 */
export interface TronTxData extends TxData {
  type: "tron";
  /** Which resource a freeze/unfreeze/undelegate acts on. Irrelevant (and absent) for sends. */
  resource?: TronResource | null;
  /** Super-representative votes, for `vote`. */
  votes?: Vote[];
  /**
   * Round-trip carrier for the wallet's legacy freeze duration. Stake 2.0's `freezebalancev2` takes
   * no duration and nothing in coin-tron reads this — do not branch on it.
   */
  duration?: number;
  /**
   * Round-trip carrier for the wallet's `Transaction.mode`, so an intent rebuilt from TxData keeps
   * it. Nothing in coin-tron reads it: validation and crafting both branch on `intent.type`, which
   * stays the single source of truth for the mode — do not branch on this field.
   */
  mode?: TronOperationMode;
}
