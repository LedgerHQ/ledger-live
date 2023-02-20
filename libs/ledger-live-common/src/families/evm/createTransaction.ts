import BigNumber from "bignumber.js";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { Transaction as EvmTransaction } from "./types";
import { DEFAULT_GAS_LIMIT } from "./transaction";

/**
 * EVM Transaction factory.
 * By default the transaction is an EIP-1559 transaction.
 * @see prepareTransaction that will make sure it's compatible or not
 */
export const createTransaction: AccountBridge<EvmTransaction>["createTransaction"] =
  (account) => ({
    family: "evm",
    mode: "send",
    amount: new BigNumber(0),
    useAllAmount: false,
    recipient: "",
    maxFeePerGas: new BigNumber(0),
    maxPriorityFeePerGas: new BigNumber(0),
    gasLimit: DEFAULT_GAS_LIMIT,
    nonce: account.operationsCount + 1,
    chainId: (account as Account).currency?.ethereumLikeInfo?.chainId || 0,
    feesStrategy: "medium",
    type: 2,
  });
