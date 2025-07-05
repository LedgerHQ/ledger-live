import { StringMemo } from "@ledgerhq/coin-framework/api/types";
import { MemoNotSupported } from "@ledgerhq/coin-framework/lib-es/api/types";

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
