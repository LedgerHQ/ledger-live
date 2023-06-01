import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { BigNumber } from "bignumber.js";
import type { DatasetTest } from "@ledgerhq/types-live";
import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughSpendableBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import type { Transaction } from "./types";
import transactionTransformer from "./transaction";
import { StellarWrongMemoFormat } from "../../errors";
import {
  addNotCreatedStellarMockAddresses,
  addMultisignStellarMockAddresses,
} from "./bridge/mock";

const notCreatedStellarMockAddress =
  "GAW46JE3SHIAYLNNNQCAZFQ437WB5ZH7LDRDWR5LVDWHCTHCKYB6RCCH";

const multisignStellarMockAddress =
  "GCDDN6T2LJN3T7SPWJQV6BCCL5KNY5GBN7X4CMSZLDEXDHXAH32TOAHS";

addNotCreatedStellarMockAddresses(notCreatedStellarMockAddress);
addMultisignStellarMockAddresses(multisignStellarMockAddress);

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    stellar: {
      scanAccounts: [
        {
          name: "stellar seed 1",
          apdus: `
            => e002000017038000002c8000009480000000766961206c756d696e61
            <= 27c586f8499294c64d57f8d7956eef4431de58ab20e1c88001f6cf131c97d6f39000
            => e002000017038000002c8000009480000001766961206c756d696e61
            <= 1174242cc3e722e843ac37db3a745897941396d486456e303001b06b417db1f89000
            => e002000017038000002c8000009480000002766961206c756d696e61
            <= 8636fa7a5a5bb9fe4fb2615f04425f54dc74c16fefc1325958c9719ee03ef5379000
            => e002000017038000002c8000009480000003766961206c756d696e61
            <= 0f052ff4b74726a6f668380927c3d23e9c16d538cb6c272add871e069336bead9000
            => e002000017038000002c8000009480000004766961206c756d696e61
            <= 60c75356c268ff0158eeca556526830761327693a93cf4754020fadbe04d0f2b9000
            => e002000017038000002c8000009480000005766961206c756d696e61
            <= 124516f8ffb161c9492486e54b4432a2c11e4817414dea54fb8bde13b5ac49439000
          `,
        },
      ],
      accounts: [
        {
          FIXME_tests: ["balance is sum of ops"],
          raw: {
            id: "libcore:1:stellar:GAT4LBXYJGJJJRSNK74NPFLO55CDDXSYVMQODSEAAH3M6EY4S7LPH5GV:sep5",
            seedIdentifier:
              "3544cee0d67187d277cd9c7e26a2bf70425b1bee8e92003f45d150c5513d531a",
            name: "Stellar 1",
            xpub: "GAT4LBXYJGJJJRSNK74NPFLO55CDDXSYVMQODSEAAH3M6EY4S7LPH5GV",
            derivationMode: "sep5",
            index: 0,
            freshAddress:
              "GAT4LBXYJGJJJRSNK74NPFLO55CDDXSYVMQODSEAAH3M6EY4S7LPH5GV",
            freshAddressPath: "44'/148'/0'",
            freshAddresses: [
              {
                address:
                  "GAT4LBXYJGJJJRSNK74NPFLO55CDDXSYVMQODSEAAH3M6EY4S7LPH5GV",
                derivationPath: "44'/148'/0'",
              },
            ],
            // @ts-expect-error wat
            unit: {
              name: "Lumen",
              code: "XLM",
              magnitude: 7,
            },
            blockHeight: 28884793,
            operations: [],
            pendingOperations: [],
            currencyId: "stellar",
            unitMagnitude: 7,
            lastSyncDate: "",
            balance: "371210662",
            spendableBalance: "371210662",
          },
          transactions: [
            {
              name: "Same as Recipient",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "GAT4LBXYJGJJJRSNK74NPFLO55CDDXSYVMQODSEAAH3M6EY4S7LPH5GV",
              }),
              expectedStatus: {
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "Send To New Account - amount is too low",
              transaction: transactionTransformer.fromTransactionRaw({
                amount: "1000",
                recipient: notCreatedStellarMockAddress,
                // Have to use an address from the test seed, here is from one coin int testing device
                useAllAmount: false,
                family: "stellar",
                baseReserve: "1500000",
                networkInfo: {
                  family: "stellar",
                  fees: "100",
                  baseFee: "100",
                  baseReserve: "1500000",
                },
                fees: "100",
                memoType: null,
                memoValue: null,
                mode: "send",
                assetCode: "",
                assetIssuer: "",
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalanceBecauseDestinationNotCreated(),
                },
                warnings: {},
              },
            },
            {
              name: "send amount more than fees + base reserve",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance,
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughSpendableBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "send more than base reserve",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance.minus("100"),
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughSpendableBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "send max to new account (explicit)",
              transaction: transactionTransformer.fromTransactionRaw({
                amount: "0",
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
                useAllAmount: true,
                family: "stellar",
                baseReserve: "1500000",
                networkInfo: {
                  family: "stellar",
                  fees: "100",
                  baseFee: "100",
                  baseReserve: "1500000",
                },
                fees: "100",
                memoType: null,
                memoValue: null,
                mode: "send",
                assetCode: "",
                assetIssuer: "",
              }),
              expectedStatus: (account) => ({
                errors: {},
                warnings: {},
                estimatedFees: new BigNumber("100"),
                amount: account.spendableBalance.minus("100"),
                totalSpent: account.spendableBalance.minus("100"),
              }),
            },
            {
              name: "memo text - success",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
                memoType: "MEMO_TEXT",
                memoValue: "01234",
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
              },
            },
            {
              name: "memo text - error",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
                memoType: "MEMO_TEXT",
                memoValue: "0123456789012345678901234567890123456789",
              }),
              expectedStatus: {
                errors: {
                  transaction: new StellarWrongMemoFormat(),
                },
                warnings: {},
              },
            },
            {
              name: "memo id - success",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
                memoType: "MEMO_ID",
                memoValue: "22",
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
              },
            },
            {
              name: "memo id - error",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
                memoType: "MEMO_ID",
                memoValue: "btest2",
              }),
              expectedStatus: {
                errors: {
                  transaction: new StellarWrongMemoFormat(),
                },
                warnings: {},
              },
            },
            {
              name: "memo hash - error",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
                memoType: "MEMO_HASH",
                memoValue: "dsadsdasdsasseeee",
              }),
              expectedStatus: {
                errors: {
                  transaction: new StellarWrongMemoFormat(),
                },
                warnings: {},
              },
            },
          ],
        },
        {
          FIXME_tests: [
            "balance is sum of ops", // We prevent user to do anything if we detect that he is a multisign user
            // SourceHasMultiSign will be launch first
            "Default empty recipient have a recipientError",
            "invalid recipient have a recipientError",
          ],
          raw: {
            id: "libcore:2:stellar:GCDDN6T2LJN3T7SPWJQV6BCCL5KNY5GBN7X4CMSZLDEXDHXAH32TOAHS:sep5",
            seedIdentifier:
              "3544cee0d67187d277cd9c7e26a2bf70425b1bee8e92003f45d150c5513d531a",
            xpub: "GCDDN6T2LJN3T7SPWJQV6BCCL5KNY5GBN7X4CMSZLDEXDHXAH32TOAHS",
            derivationMode: "sep5",
            index: 2,
            freshAddress:
              "GCDDN6T2LJN3T7SPWJQV6BCCL5KNY5GBN7X4CMSZLDEXDHXAH32TOAHS",
            freshAddressPath: "44'/148'/2'",
            freshAddresses: [
              {
                address:
                  "GCDDN6T2LJN3T7SPWJQV6BCCL5KNY5GBN7X4CMSZLDEXDHXAH32TOAHS",
                derivationPath: "44'/148'/2'",
              },
            ],
            name: "Stellar 3",
            // @ts-expect-error wat
            unit: {
              name: "Lumen",
              code: "XLM",
              magnitude: 7,
            },
            blockHeight: 28884848,
            operations: [],
            pendingOperations: [],
            currencyId: "stellar",
            unitMagnitude: 7,
            lastSyncDate: "",
            balance: "59999500",
            spendableBalance: "59999500",
          },
          transactions: [
            {
              name: "Multisign - error",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
                memoType: "MEMO_HASH",
                memoValue: "dsadsdasdsasseeee",
              }),
              expectedStatus: {
                errors: {
                  transaction: new StellarWrongMemoFormat(),
                },
                warnings: {},
              },
            },
          ],
        },
        {
          FIXME_tests: ["balance is sum of ops"],
          raw: {
            id: "js:1:stellar:f30b743cb3a8bc8c3ea8fe8455c6a52221cc6cf867f7f1f5861dd52aba1d0b8a:sep5",
            seedIdentifier: "gre",
            name: "GRE's Stellar 2",
            xpub: "f30b743cb3a8bc8c3ea8fe8455c6a52221cc6cf867f7f1f5861dd52aba1d0b8a",
            derivationMode: "sep5",
            index: 1,
            freshAddress: "",
            freshAddressPath: "44'/148'/1'",
            freshAddresses: [],
            balance: "0",
            blockHeight: 0,
            currencyId: "stellar",
            lastSyncDate: "",
            operations: [],
            pendingOperations: [],
            unitMagnitude: 7,
          },
        },
        {
          FIXME_tests: ["balance is sum of ops"],
          raw: {
            id: "js:1:stellar:GD7G4RE27CMFTUUUVZBJJ2GBK5GCTD5JQFE5FJCENAUD6AFAVMOBZTSK:sep5",
            seedIdentifier: "LIVE-3170",
            name: "Large Stellar account",
            xpub: "GD7G4RE27CMFTUUUVZBJJ2GBK5GCTD5JQFE5FJCENAUD6AFAVMOBZTSK",
            derivationMode: "sep5",
            index: 1,
            freshAddress: "",
            freshAddressPath: "44'/148'/1'",
            freshAddresses: [],
            balance: "0",
            blockHeight: 0,
            currencyId: "stellar",
            lastSyncDate: "",
            operations: [],
            pendingOperations: [],
            unitMagnitude: 7,
          },
        },
        {
          FIXME_tests: ["balance is sum of ops"],
          raw: {
            id: "libcore:1:stellar:GAS5NQ2VU6LA3QPDSCVBH66IHP2RE52VFCLFQKSGRF7VKMZA2KTLGI3M:sep5",
            seedIdentifier:
              "25d6c355a7960dc1e390aa13fbc83bf51277552896582a46897f553320d2a6b3",
            name: "Stellar 4",
            xpub: "GAS5NQ2VU6LA3QPDSCVBH66IHP2RE52VFCLFQKSGRF7VKMZA2KTLGI3M",
            derivationMode: "sep5",
            index: 0,
            freshAddress:
              "GAS5NQ2VU6LA3QPDSCVBH66IHP2RE52VFCLFQKSGRF7VKMZA2KTLGI3M",
            freshAddressPath: "44'/148'/0'",
            freshAddresses: [
              {
                address:
                  "GAS5NQ2VU6LA3QPDSCVBH66IHP2RE52VFCLFQKSGRF7VKMZA2KTLGI3M",
                derivationPath: "44'/148'/0'",
              },
            ],
            balance: "0",
            blockHeight: 0,
            currencyId: "stellar",
            lastSyncDate: "",
            operations: [],
            pendingOperations: [],
            unitMagnitude: 7,
          },
          transactions: [
            {
              name: "check spendable balance (selling_liabilities is not zero)",
              transaction: (t) => ({
                ...t,
                useAllAmount: true,
                fees: new BigNumber("0"),
                recipient:
                  "GAIXIJBMYPTSF2CDVQ35WOTULCLZIE4W2SDEK3RQGAA3A22BPWY7R53Z",
              }),
              expectedStatus: {
                // You can get the spenaable balance here
                // https://stellar.expert/explorer/public/account/GAS5NQ2VU6LA3QPDSCVBH66IHP2RE52VFCLFQKSGRF7VKMZA2KTLGI3M
                amount: new BigNumber(12485498),
                errors: {},
                warnings: {},
              },
            },
          ],
        },
      ],
    },
  },
};

testBridge(dataset);
