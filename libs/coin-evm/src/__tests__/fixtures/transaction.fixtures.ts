import BigNumber from "bignumber.js";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { makeAccount, makeTokenAccount } from "./common.fixtures";
import {
  EvmTransactionEIP1559,
  EvmTransactionEIP1559Raw,
  EvmTransactionLegacy,
  EvmTransactionLegacyRaw,
  Transaction as EvmTransaction,
} from "../../types";

export const testData = Object.freeze(Buffer.from("testBufferString").toString("hex"));

export const rawEip1559Tx: EvmTransactionEIP1559Raw = Object.freeze(
  Object.freeze({
    amount: "100",
    useAllAmount: false,
    subAccountId: "id",
    recipient: "0xkvn",
    feesStrategy: "custom",
    family: "evm",
    mode: "send",
    nonce: 0,
    gasLimit: "21000",
    chainId: 1,
    data: testData,
    maxFeePerGas: "10000",
    maxPriorityFeePerGas: "10000",
    additionalFees: "420",
    type: 2,
  }),
);

export const eip1559Tx: EvmTransactionEIP1559 = Object.freeze(
  Object.freeze({
    amount: new BigNumber(100),
    useAllAmount: false,
    subAccountId: "id",
    recipient: "0xkvn",
    feesStrategy: "custom",
    family: "evm",
    mode: "send",
    nonce: 0,
    gasLimit: new BigNumber(21000),
    chainId: 1,
    data: Buffer.from(testData, "hex"),
    maxFeePerGas: new BigNumber(10000),
    maxPriorityFeePerGas: new BigNumber(10000),
    additionalFees: new BigNumber(420),
    type: 2,
  }),
);

export const rawLegacyTx: EvmTransactionLegacyRaw = Object.freeze(
  Object.freeze({
    amount: "100",
    useAllAmount: false,
    subAccountId: "id",
    recipient: "0xkvn",
    feesStrategy: "custom",
    family: "evm",
    mode: "send",
    nonce: 0,
    gasLimit: "21000",
    chainId: 1,
    data: testData,
    gasPrice: "10000",
    additionalFees: "420",
    type: 0,
  }),
);

export const legacyTx: EvmTransactionLegacy = Object.freeze(
  Object.freeze({
    amount: new BigNumber(100),
    useAllAmount: false,
    subAccountId: "id",
    recipient: "0xkvn",
    feesStrategy: "custom",
    family: "evm",
    mode: "send",
    nonce: 0,
    gasLimit: new BigNumber(21000),
    chainId: 1,
    data: Buffer.from(testData, "hex"),
    gasPrice: new BigNumber(10000),
    additionalFees: new BigNumber(420),
    type: 0,
  }),
);

export const currency: CryptoCurrency = Object.freeze({
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
    rpc: "https://my-rpc.com",
    explorer: {
      uri: "https://api.com",
      type: "etherscan" as const,
    },
  },
});
export const tokenCurrency = Object.freeze(getTokenById("ethereum/erc20/usd__coin"));
export const tokenAccount = makeTokenAccount("0xkvn", tokenCurrency);
export const account = makeAccount("0xkvn", currency, [tokenAccount]);

export const tokenTransaction: EvmTransaction = {
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: tokenAccount.id,
  recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
  feesStrategy: "custom",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(60000),
  chainId: 1,
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
};
