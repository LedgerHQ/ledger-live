import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { DatasetTest } from "../../types";
import { BigNumber } from "bignumber.js";
import {
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughBalanceBecauseDestinationNotCreated,
} from "@ledgerhq/errors";
import type { Transaction } from "./types";
import {
  NewValidatorAddressRequired,
  OldValidatorAddressRequired,
  ValidatorAddressRequired,
} from "./errors";

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    helium: {
      scanAccounts: [
        {
          name: "helium seed 1",
          apdus: `
          => e00200000d038000002c8000038880000000
          <= 000123ab82f57f7ab4f19097c1a118df91afc5077954d6a012e0086a418ba15590389000
          => e002000015058000002c80000388800000008000000080000000
          <= 000123ab82f57f7ab4f19097c1a118df91afc5077954d6a012e0086a418ba15590389000
          `,
        },
      ],
      accounts: [
        {
          raw: {
            id: `js:2:helium:13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N:helium`,
            seedIdentifier: `23ab82f57f7ab4f19097c1a118df91afc5077954d6a012e0086a418ba1559038`,
            name: "Helium 1",
            derivationMode: "helium",
            index: 0,
            freshAddress: "13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N",
            freshAddressPath: "44'/904'/0'/0'/0'",
            freshAddresses: [
              {
                address: "13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N",
                derivationPath: "44'/904'/0'/0'/0'",
              },
            ],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "helium",
            unitMagnitude: 10,
            lastSyncDate: "",
            balance: "2111000",
          },
          transactions: [
            // HERE WE WILL INSERT OUR test
            {
              name: "Same as Recipient",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber(100),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "Account creation minimum amount too low",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100"),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalanceBecauseDestinationNotCreated(),
                },
                warnings: {},
              },
            },
            {
              name: "send",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("1000"),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
              },
            },
            {
              name: "send amount more than fees + base reserve",
              transaction: (t, account) => ({
                ...t,
                amount: account.balance,
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
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
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "send Token",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("1000"),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {},
                warnings: {},
                amount: new BigNumber("1000"),
              },
            },
            {
              name: "send Token - more than available",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                recipient:
                  "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                model: {
                  mode: "send",
                  memo: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NotEnoughBalance(),
                },
                warnings: {},
              },
            },
            {
              name: "Stake - validator address required",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "stake",
                  validatorAddress: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new ValidatorAddressRequired(),
                },
                warnings: {},
              },
            },
            {
              name: "Stake - validator invalid address",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "stake",
                  validatorAddress: "1234",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new InvalidAddress(),
                },
                warnings: {},
              },
            },
            {
              name: "Stake - validator address is also source",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "stake",
                  validatorAddress:
                    "13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "Stake - validator min amount required",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("1"),
                model: {
                  mode: "stake",
                  validatorAddress:
                    "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "Unstake - validator address required",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "unstake",
                  validatorAddress: "",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new ValidatorAddressRequired(),
                },
                warnings: {},
              },
            },
            {
              name: "Unstake - validator invalid address",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "unstake",
                  validatorAddress: "1234",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new InvalidAddress(),
                },
                warnings: {},
              },
            },
            {
              name: "Unstake - validator address is also source",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "unstake",
                  validatorAddress:
                    "13DTKSEQYRfMgUHXFzgWqUKqokcpd2E4XBF9whPWXJZmT8iBw6N",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "Unstake - validator min amount required",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("1"),
                model: {
                  mode: "unstake",
                  validatorAddress:
                    "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new InvalidAddressBecauseDestinationIsAlsoSource(),
                },
                warnings: {},
              },
            },
            {
              name: "Transfer Stake - old validator address required",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "transfer",
                  oldValidatorAddress: "",
                  newValidatorAddress:
                    "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                  paymentAmount: new BigNumber(0),
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new OldValidatorAddressRequired(),
                },
                warnings: {},
              },
            },
            {
              name: "Transfer Stake - invalid old validator address",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "transfer",
                  oldValidatorAddress: "123",
                  newValidatorAddress:
                    "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                  paymentAmount: new BigNumber(0),
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new InvalidAddress(),
                },
                warnings: {},
              },
            },
            {
              name: "Transfer Stake - new validator address required",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "transfer",
                  oldValidatorAddress:
                    "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                  newValidatorAddress: "",
                  paymentAmount: new BigNumber(0),
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NewValidatorAddressRequired(),
                },
                warnings: {},
              },
            },
            {
              name: "Transfer Stake - invalid new validator address",
              transaction: (t) => ({
                ...t,
                amount: new BigNumber("100000000000"),
                model: {
                  mode: "transfer",
                  oldValidatorAddress:
                    "1br5rK7f4MCpHuezwJjxywLr4pmeMoRMtrkfurNfXAAtJ2Xuk8v",
                  newValidatorAddress: "123",
                  paymentAmount: new BigNumber(0),
                },
              }),
              expectedStatus: {
                errors: {
                  amount: new NewValidatorAddressRequired(),
                },
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
