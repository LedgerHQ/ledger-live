import BigNumber from "bignumber.js";
import { AccountBridge, AccountLike } from "@ledgerhq/types-live";
import { Transaction as EvmTransaction } from "./types";
import { DEFAULT_GAS_LIMIT } from "./transaction";

/**
 * arbitrary default value for a new transaction nonce
 * the actual nonce will be set by `prepareForSignOperation`
 */
export const DEFAULT_NONCE = -1;

const getChainId = (account: AccountLike): number => {
  if (account.type === "Account") {
    return account.currency.ethereumLikeInfo?.chainId || 0;
  }
  if (account.type === "TokenAccount") {
    return account.token.parentCurrency.ethereumLikeInfo?.chainId || 0;
  }
  return 0;
};

/**
 * EVM Transaction factory.
 * By default the transaction is an EIP-1559 transaction.
 * @see prepareTransaction that will make sure it's compatible or not
 */
export const createTransaction: AccountBridge<EvmTransaction>["createTransaction"] = account => ({
  family: "evm",
  mode: "send",
  amount: new BigNumber(0),
  useAllAmount: false,
  recipient: "",
  maxFeePerGas: new BigNumber(0),
  maxPriorityFeePerGas: new BigNumber(0),
  gasLimit: DEFAULT_GAS_LIMIT,
  nonce: DEFAULT_NONCE,
  chainId: getChainId(account),
  feesStrategy: "medium",
  type: 2,
});
