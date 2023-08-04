import BigNumber from "bignumber.js";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { Transaction as EvmTransaction } from "./types";
import { DEFAULT_GAS_LIMIT } from "./transaction";

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
  // should / could be undefined but then would conflict with type of "ethers.Transaction" used in libs/coin-evm/src/adapters/ethers.ts
  nonce: -1, // hacky way to know if the transaction is signed or not
  chainId: (account as Account).currency?.ethereumLikeInfo?.chainId || 0,
  feesStrategy: "medium",
  type: 2,
});
