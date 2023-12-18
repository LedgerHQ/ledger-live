import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { getAccountBridge } from "../../bridge";
import { decodeAccountId, encodeAccountId, fromAccountRaw } from "../../account";
import { BigNumber } from "bignumber.js";
import { AmountRequired, InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";

import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "../filecoin/transaction";

const SEED_IDENTIFIER = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_1 = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_2 = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const ACCOUNT_3 = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";
const ACCOUNT_4 = "f01840380";

const filecoin: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "filecoin seed 1",
      apdus: `
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000000000000
      <= 04a208ea1ff17aa9fff9ae63483f40f93cbbdfbbbe74e70fb8ab2a452e3ed65f86890d3cd43e7a78594b6e42573db3db9cbe4b378554b43624eac83ff783b2a3791501f12b13543456cf32f3918bfdcfe636cd0cb5730d29663136657672677662756b3368746634347272703634377a72777a75676c6b34796e6f6969767667699000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c00008001000080000000800000000000000000
      <= 0406971d45d92c5cde8f791f3c49ce72af574864ca1ea2c1225b5f254d85261a991f2750ca649d94a5db4e5c34eedc1b82155bbd4b79f72d9dbab6f6213c4d9aa8150156a902a0af654cdf44a2fe214f51e22dfa2957dd2974316b327571666966706d76676e36726663377971753675706366783563737636356f6165776b63619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080010000800000000000000000
      <= 0408dc3c78f9c78962f2b6ca0d25730909d8588510162080990b927f856b256f7c7fc0b72108d93a4e495b20f74d98a2dd7387fa1bc0eb79fdba4d76508ced568b15014daff9b25ed9cb7828531d3821f58a31791fe9942966316a777837746d733633686678716b63746475346364356d6b6766347237326d756c6470666661619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080020000800000000000000000
      <= 049b37aa36aa5ba0fee02b75517f238470530b9c0e796d4c75399e796d46a77ca3baf93f49f7e99074a53fe3ea032c8949c69e5b56ba004415827fc8ea0cd3f7e01501d336d60d4d2405db191637d909c6a9a9c77adf6b296631326d336e6d646b6e657163357767697767376d717472766a766864787678336c6c7473737378619000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000001000000
      <= 04acc74bca6a4266105150ce83ee58501853ed0be806192e78cb9963d5cdc121defc2bbcf8f065f2dbc83d5c67a3ff0a04e58b492a16ac12662cad6494df5ac87b15017556a64db04a3f68d46f1625b46b42f69c1081862966316f766c6b6d746e716a69377772766470637973336932326336326f6262616d676f6b6d673335719000
      => 0600000000
      <= 0000170900331000049000
      => 06010000142c000080cd010080000000800000000002000000
      <= 0463a3f03f99d522c61878862a2af95169b44cd6893e34610ef19b61a786866c59e093e35f688256dc228df6dd4eb184aa82ac0fe484d4dd57edba5b749599b06215017b45bd8820d0b40db97000ceefd90e3e1d20a97b296631706e63333363626132633261336f6c716164686f3777696f68796f73626b6c33757065736365699000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:filecoin:${SEED_IDENTIFIER}:`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "Filecoin 1",
        derivationMode: "" as const,
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/461'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "filecoin",
        unitMagnitude: 18,
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Not a valid address (fil)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 100,
            gasPremium: "200",
            recipient: "novalidaddress",
            amount: "100000000",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Not a valid address (eth)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 100,
            gasPremium: "200",
            recipient: "0x689c9b3232210tt9b84ef444d0ef35d11102adjj",
            amount: "100000000",
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
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "100000000000000000000",
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "10",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "0",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f1)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f0)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_4,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (0x eth)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_3,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f4)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_2,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "Send max",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "1",
            useAllAmount: true,
          }),
          expectedStatus: (account, tx, status) => {
            return {
              amount: account.spendableBalance.minus(status.estimatedFees),
              errors: {},
              warnings: {},
            };
          },
        },
      ],
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    filecoin,
  },
};

testBridge(dataset);

describe("estimateMaxSpendable", () => {
  test("it should failed on invalid recipient", async () => {
    const accounts = dataset.currencies["filecoin"].accounts || [];
    const accountData = accounts[0];

    const account = fromAccountRaw({
      ...accountData.raw,
      id: encodeAccountId({
        ...decodeAccountId(accountData.raw.id),
        type: dataset.implementations[0],
      }),
    });

    const accountBridge = getAccountBridge(account);
    const estimate = async () => {
      await accountBridge.estimateMaxSpendable({
        account,
        transaction: { recipient: "notavalidrecipient" },
      });
    };

    await expect(estimate).rejects.toThrowError(new InvalidAddress());
  });
});
