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

const PUBKEY = "15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e";
const ADDRESS = `k:${PUBKEY}`;
const ADDRESS_2 = "k:147451f9f5097e963482c2c74f4b4e36eb32b70474c5356d3c812148fbf9a399";

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
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:kadena:15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e:`,
        seedIdentifier: PUBKEY,
        name: "Kadena 1",
        derivationMode: "",
        index: 0,
        xpub: PUBKEY,
        freshAddress: ADDRESS,
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
          name: "Same as Recipient",
          transaction: t => ({
            ...t,
            amount: new BigNumber(20),
            recipient: "k:15daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "kadena",
            recipient: ADDRESS_2,
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
        {
          name: "Send max",
          transaction: fromTransactionRaw({
            family: "kadena",
            recipient: ADDRESS_2,
            amount: "10",
            useAllAmount: true,
            receiverChainId: 0,
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
