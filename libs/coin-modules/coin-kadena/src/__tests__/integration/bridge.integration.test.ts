import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { KDA_FEES_BASE, KDA_GAS_LIMIT_TRANSFER } from "../../constants";
import { fromTransactionRaw } from "../../transaction";
import type { Transaction } from "../../types";
import { baseUnitToKda } from "../../utils";

const ADDRESS_1_PUBKEY = "15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e";
const ADDRESS_1 = `k:${ADDRESS_1_PUBKEY}`;
const ADDRESS_2 = "k:ced7b6fcaf2421b294f431965374d43e3b97352131609162d6c78325ad609015";
const ADDRESS_3_PUBKEY = "5ff480618154d676aafb4637f75b0f4de9b4be64b54544333713e04f73875701";
const ADDRESS_3 = `k:${ADDRESS_3_PUBKEY}`;
const ADDRESS_4 = "k:65b3bdbf288431917ab8b0d91eafbddf4367d46e24a6186a3c7b75c0cb3bf8a3";

const kadena: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "kadena seed 1",
      apdus: `
      => 00210000142c00008072020080000000800000000000000000
      <= 15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e9000
      => 00210000142c00008072020080010000800000000000000000
      <= ced7b6fcaf2421b294f431965374d43e3b97352131609162d6c78325ad6090159000
      => 00210000142c00008072020080020000800000000000000000
      <= 5ff480618154d676aafb4637f75b0f4de9b4be64b54544333713e04f738757019000
      => 00210000142c00008072020080030000800000000000000000
      <= 65b3bdbf288431917ab8b0d91eafbddf4367d46e24a6186a3c7b75c0cb3bf8a39000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:kadena:${ADDRESS_1_PUBKEY}:`,
        seedIdentifier: ADDRESS_1_PUBKEY,
        name: "Kadena 1",
        derivationMode: "",
        index: 0,
        xpub: ADDRESS_1_PUBKEY,
        freshAddress: ADDRESS_1,
        freshAddressPath: "44'/626'/0'/0/0'",
        blockHeight: 4333588,
        operations: [],
        pendingOperations: [],
        currencyId: "kadena",
        lastSyncDate: "",
        balance: "17.4979",
      },
      transactions: [
        {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "kadena",
            recipient: "novalidaddress",
            amount: "1000",
            receiverChainId: 0,
            senderChainId: 0,
            gasLimit: KDA_GAS_LIMIT_TRANSFER.toFixed(),
            gasPrice: KDA_FEES_BASE,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "kadena",
            recipient: ADDRESS_2,
            amount: baseUnitToKda(20).toString(),
            receiverChainId: 0,
            senderChainId: 0,
            gasLimit: KDA_GAS_LIMIT_TRANSFER.toFixed(),
            gasPrice: KDA_FEES_BASE,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Same recipient",
          transaction: t => ({
            ...t,
            amount: new BigNumber(20),
            recipient: ADDRESS_1,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "Same recipient but different chain",
          transaction: t => ({
            ...t,
            amount: new BigNumber(20),
            recipient: ADDRESS_1,
            receiverChainId: 0,
            senderChainId: 1,
          }),
          expectedStatus: {
            amount: new BigNumber(20),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "kadena",
            recipient: ADDRESS_4,
            amount: "10",
            receiverChainId: 0,
            senderChainId: 0,
            gasLimit: KDA_GAS_LIMIT_TRANSFER.toFixed(),
            gasPrice: KDA_FEES_BASE,
          }),
          expectedStatus: {
            amount: new BigNumber("10"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "Sufficient amount and cross chain transfer",
          transaction: fromTransactionRaw({
            family: "kadena",
            recipient: ADDRESS_2,
            amount: "10",
            receiverChainId: 0,
            senderChainId: 1,
            gasLimit: KDA_GAS_LIMIT_TRANSFER.toFixed(),
            gasPrice: KDA_FEES_BASE,
          }),
          expectedStatus: {
            amount: new BigNumber("10"),
            errors: {},
            warnings: {},
          },
        },
      ],
    },
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:kadena:${ADDRESS_3_PUBKEY}:`,
        seedIdentifier: ADDRESS_3_PUBKEY,
        name: "Kadena 1",
        derivationMode: "",
        index: 0,
        xpub: ADDRESS_3_PUBKEY,
        freshAddress: ADDRESS_3,
        freshAddressPath: "44'/626'/0'/0/0'",
        blockHeight: 4333588,
        operations: [],
        pendingOperations: [],
        currencyId: "kadena",
        lastSyncDate: "",
        balance: "17.4979",
      },
      transactions: [
        {
          name: "Send max",
          transaction: fromTransactionRaw({
            family: "kadena",
            recipient: ADDRESS_2,
            amount: "10",
            useAllAmount: true,
            receiverChainId: 1,
            senderChainId: 0,
            gasLimit: KDA_GAS_LIMIT_TRANSFER.toFixed(),
            gasPrice: KDA_FEES_BASE,
          }),
          expectedStatus: account => {
            const fees = BigNumber(KDA_FEES_BASE).multipliedBy(KDA_GAS_LIMIT_TRANSFER);
            return {
              amount: account?.spendableBalance.minus(fees),
              errors: {},
              warnings: {},
            };
          },
        },
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    kadena,
  },
};
