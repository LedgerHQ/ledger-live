import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets/abandonseed";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { InvalidMemoMina, AccountCreationFeeWarning, AmountTooSmall } from "../bridge/errors";
import { fromTransactionRaw } from "../bridge/transaction";
import type { Transaction } from "../types/common";

const ACCOUNT_ADDRESS = "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD";
const ACCOUNT_ADDRESS_1 = "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314";
const ACCOUNT_ABANDONED = getAbandonSeedAddress("mina");

const mina: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["blockHash", "resources"],
  scanAccounts: [
    {
      name: "mina seed 1",
      apdus: `
      => e00201000400000000
      <= 423632716a574c733157334a3266464769786558343977316f3756765347754d424e6f746e46687a7333505a3750627464466268646544009000
      => e00201000400000001
      <= 423632716e4438387474693632364d694d6e7568504d624c69504c766664644657486a47667377795646754c5845614b644b366f344263009000
      => e00201000400000002
      <= 423632716a7048577878544457506e474372714b546b56414b596f4e5250374c6e454b356564766d717151394658736e61313166674741009000
      `,
    },
  ],
  accounts: [
    {
      // Skipping due to rewards being auto-compounded, no operation as evidence
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:mina:${ACCOUNT_ADDRESS}:`,
        seedIdentifier: `${ACCOUNT_ADDRESS}`,
        name: "MINA 1",
        derivationMode: "minabip44",
        index: 0,
        freshAddress: `${ACCOUNT_ADDRESS}`,
        freshAddressPath: "44'/12586'/0'/0'/0'",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "mina",
        lastSyncDate: "",
        balance: "1000000",
      },
      transactions: [
        {
          name: "not a valid address",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: "novalidaddress",
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            amount: "1000",
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "not enough balance",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            amount: (300 * 1e9).toString(),
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "invalid Memo",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            amount: "1000",
            memo: "string greated than 32 chars is invalid",
            nonce: 0,
          }),
          expectedStatus: {
            errors: {
              transaction: new InvalidMemoMina(),
            },
            warnings: {},
          },
        },
        {
          name: "amount Required",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            memo: undefined,
            amount: "0",
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            nonce: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "recipient same as source",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS,
            amount: "10",
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "recipient required",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: "",
            amount: "1000",
            fees: {
              fee: new BigNumber(100000).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {
              recipient: new RecipientRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "fee loaded when missing",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            amount: "1000",
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "account creation fee warning",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ABANDONED,
            amount: "1000000",
            fees: {
              fee: new BigNumber(100000).toString(),
              accountCreationFee: new BigNumber(1000000).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {},
            warnings: {
              recipient: new AccountCreationFeeWarning(),
            },
          },
        },
        {
          name: "amount too small for account creation",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ABANDONED,
            amount: "500000",
            fees: {
              fee: new BigNumber(100000).toString(),
              accountCreationFee: new BigNumber(1000000).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new AmountTooSmall(),
            },
            warnings: {
              recipient: new AccountCreationFeeWarning(),
            },
          },
        },
        {
          name: "use all amount",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            amount: "0",
            useAllAmount: true,
            fees: {
              fee: new BigNumber(100000).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "staking transaction with zero fee",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            amount: "1000",
            txType: "stake",
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "staking transaction with zero amount",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            amount: "0",
            txType: "stake",
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "new account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "mina",
            recipient: ACCOUNT_ADDRESS_1,
            amount: "1000",
            fees: {
              fee: new BigNumber(0).toString(),
              accountCreationFee: new BigNumber(0).toString(),
            },
            memo: undefined,
            nonce: 0,
          }),
          expectedStatus: {
            amount: new BigNumber("1000"),
            errors: {},
            warnings: {},
          },
        },
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    mina,
  },
};
