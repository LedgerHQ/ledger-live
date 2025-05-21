import { Asset } from "@ledgerhq/coin-framework/api/types";

export type TronToken = Trc10Token | Trc20Token;
export type TronAsset = Asset<TronToken>;

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
export type Trc10Token = {
  standard: "trc10";
  tokenId: string;
};

/*
  TRC20 tokens are smart contracts that implement the TRC20 interface.

  https://tronscan.org/#/token20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
  {
    standard: "trc20",
    contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  }
*/
export type Trc20Token = {
  standard: "trc20";
  contractAddress: string;
};
