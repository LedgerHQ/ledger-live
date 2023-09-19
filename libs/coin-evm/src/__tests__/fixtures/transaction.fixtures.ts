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
  EvmNftTransactionRaw,
  EvmNftTransaction,
} from "../../types";

export const testData = Object.freeze(Buffer.from("testBufferString").toString("hex"));

const rawNft = Object.freeze({
  tokenId: "123",
  contract: "0xContract",
  quantity: "10",
  collectionName: "collectionName",
});

const nft = Object.freeze({
  tokenId: "123",
  contract: "0xContract",
  quantity: new BigNumber("10"),
  collectionName: "collectionName",
});

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
    gasOptions: {
      slow: {
        maxFeePerGas: "10000",
        maxPriorityFeePerGas: "15000",
        gasPrice: null,
        nextBaseFee: "16000",
      },
      medium: {
        maxFeePerGas: "20000",
        maxPriorityFeePerGas: "25000",
        gasPrice: null,
        nextBaseFee: "16000",
      },
      fast: {
        maxFeePerGas: "30000",
        maxPriorityFeePerGas: "35000",
        gasPrice: null,
        nextBaseFee: "16000",
      },
    },
    type: 2,
  }),
);

export const rawNftEip1559Tx: EvmTransactionEIP1559Raw & EvmNftTransactionRaw = Object.freeze({
  ...rawEip1559Tx,
  mode: "erc721",
  nft: rawNft,
});

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
    gasOptions: {
      slow: {
        maxFeePerGas: new BigNumber(10000),
        maxPriorityFeePerGas: new BigNumber(15000),
        gasPrice: null,
        nextBaseFee: new BigNumber(16000),
      },
      medium: {
        maxFeePerGas: new BigNumber(20000),
        maxPriorityFeePerGas: new BigNumber(25000),
        gasPrice: null,
        nextBaseFee: new BigNumber(16000),
      },
      fast: {
        maxFeePerGas: new BigNumber(30000),
        maxPriorityFeePerGas: new BigNumber(35000),
        gasPrice: null,
        nextBaseFee: new BigNumber(16000),
      },
    },
    type: 2,
  }),
);

export const nftEip1559tx = Object.freeze({
  ...eip1559Tx,
  mode: "erc721",
  nft,
});

export const rawLegacyTx: EvmTransactionLegacyRaw = Object.freeze({
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
  gasOptions: {
    slow: {
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      gasPrice: "10000",
      nextBaseFee: null,
    },
    medium: {
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      gasPrice: "20000",
      nextBaseFee: null,
    },
    fast: {
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      gasPrice: "30000",
      nextBaseFee: null,
    },
  },
  type: 0,
});

export const nftRawLegacyTx: EvmTransactionLegacyRaw & EvmNftTransactionRaw = Object.freeze({
  ...rawLegacyTx,
  mode: "erc721",
  nft: rawNft,
});

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
    gasOptions: {
      slow: {
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice: new BigNumber(10000),
        nextBaseFee: null,
      },
      medium: {
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice: new BigNumber(20000),
        nextBaseFee: null,
      },
      fast: {
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        gasPrice: new BigNumber(30000),
        nextBaseFee: null,
      },
    },
    type: 0,
  }),
);

export const nftLegacyTx: EvmTransactionLegacy & EvmNftTransaction = Object.freeze({
  ...legacyTx,
  mode: "erc721",
  nft,
});

export const currency: CryptoCurrency = Object.freeze({
  ...getCryptoCurrencyById("ethereum"),
  ethereumLikeInfo: {
    chainId: 1,
    node: {
      type: "external" as const,
      uri: "https://my-rpc.com",
    },
    explorer: {
      type: "etherscan" as const,
      uri: "https://api.com",
    },
  },
});
export const tokenCurrency = Object.freeze(getTokenById("ethereum/erc20/usd__coin"));
export const tokenAccount = makeTokenAccount(
  "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
  tokenCurrency,
);
export const account = makeAccount("0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d", currency, [
  tokenAccount,
]);

export const tokenTransaction: EvmTransaction = Object.freeze({
  family: "evm",
  mode: "send",
  amount: new BigNumber(100),
  useAllAmount: false,
  subAccountId: tokenAccount.id,
  recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
  feesStrategy: "custom",
  nonce: 0,
  gasLimit: new BigNumber(60000),
  chainId: 1,
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
});

export const erc721Transaction: EvmTransaction = Object.freeze({
  family: "evm",
  mode: "erc721",
  amount: new BigNumber(0),
  useAllAmount: false,
  recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
  feesStrategy: "custom",
  nonce: 0,
  gasLimit: new BigNumber(60000),
  chainId: 1,
  nft: {
    contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    tokenId: "1",
    quantity: new BigNumber(1),
    collectionName: "BAYC",
  },
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
});

export const erc1155Transaction: EvmTransaction = Object.freeze({
  family: "evm",
  mode: "erc1155",
  amount: new BigNumber(0),
  useAllAmount: false,
  recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
  feesStrategy: "custom",
  nonce: 0,
  gasLimit: new BigNumber(60000),
  chainId: 1,
  nft: {
    contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    tokenId: "1",
    quantity: new BigNumber(10),
    collectionName: "BAYC",
  },
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
});

export const erc1155TransactionNonFinite: EvmTransaction = Object.freeze({
  family: "evm",
  mode: "erc1155",
  amount: new BigNumber(0),
  useAllAmount: false,
  recipient: "0x51DF0aF74a0DBae16cB845B46dAF2a35cB1D4168", // michel.eth
  feesStrategy: "custom",
  nonce: 0,
  gasLimit: new BigNumber(60000),
  chainId: 1,
  nft: {
    contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    tokenId: "1",
    quantity: new BigNumber(Infinity),
    collectionName: "BAYC",
  },
  maxFeePerGas: new BigNumber(100),
  maxPriorityFeePerGas: new BigNumber(100),
  type: 2,
});
