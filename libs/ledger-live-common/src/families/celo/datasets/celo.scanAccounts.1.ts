import BigNumber from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import "../../../__tests__/test-helpers/setup";
import TransactionModule from "../transaction";
import { CeloAllFundsWarning } from "../errors";
import type {
  AccountRaw,
  CurrenciesData,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { Transaction } from "../types";

// This account is registered for staking and has available funds, locked voting funds,
// locked non-voting funds, and withdrawable funds.
const LEDGER_CELO_ACCOUNT_1 = "0xcfD48e0FAf9f19377509cE68a6A6F4D9C85ff8AB";
// This account has no funds and isn't registered for staking.
const LEDGER_CELO_ACCOUNT_2 = "0x2cC7E5913bADa8FA2895bDeF7F4C2E36C2368Abb";
const VALIDATOR_ACCOUNT_1 = "0x0861a61Bf679A30680510EcC238ee43B82C5e843";

const dataset: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "Celo 1",
      apdus: `
      => e00200000d038000002c8000ce1080000000
      <= 410453390dcc1e6f1be0fb34f837b278ed1b4c84097c7493c13a0d915c735af1d8aa445d2738a95e8f50bc22abd2e17cb868d4db22a623d99d861740eb93373d50a328383735443736394535333337363338363732386136374632463564326435666561374637356233399000
      => e002000015058000002c8000ce10800000000000000000000000
      <= 4104eedca4417737f2dae0e12320edba0e845e4ced411e6e2978a9165dde3891099402ff4906ecaab03232f8273592287a94866f14f17b5e2bf6e31837278127919c28636644343865304641663966313933373735303963453638613641364634443943383566663841429000
      => e002000015058000002c8000ce10800000010000000000000000
      <= 41042304dfd28a236eb03471986b90f0a3a111537b35766ae8ff78a9f588071f56ec127531a2498b36e856c759bc2734297a07f9f4b331153a8c9c21171f6488884e28326343374535393133624144613846413238393562446546374634433245333643323336384162629000
      `,
    },
  ],
  accounts: [
    {
      // Ignoring the "balance is sum of ops" test since that
      // doesn't seem to take into account staked tokens properly.
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:celo:${LEDGER_CELO_ACCOUNT_1}:`,
        seedIdentifier:
          "0453390dcc1e6f1be0fb34f837b278ed1b4c84097c7493c13a0d915c735af1d8aa445d2738a95e8f50bc22abd2e17cb868d4db22a623d99d861740eb93373d50a3",
        name: "Celo 1",
        derivationMode: "",
        index: 0,
        freshAddress: LEDGER_CELO_ACCOUNT_1,
        freshAddressPath: "44'/52752'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "celo",
        unitMagnitude: 18,
        lastSyncDate: "",
        balance: "399893159500000000",
        celoResources: {
          registrationStatus: true,
          lockedBalance: "1000000",
          nonvotingLockedBalance: "900000",
          pendingWithdrawals: [],
          votes: [
            {
              validatorGroup: VALIDATOR_ACCOUNT_1,
              amount: "100000",
              activatable: true,
              revokable: true,
              type: "active",
              index: 0,
            },
          ],
          electionAddress: "0x8D6677192144292870907E3Fa8A5527fE55A7ff6",
          lockedGoldAddress: "0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E",
        },
      } as AccountRaw,
      transactions: [
        {
          name: "Same as Recipient",
          transaction: (t) => ({
            ...t,
            amount: new BigNumber(100),
            recipient: LEDGER_CELO_ACCOUNT_1,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "Invalid Address",
          transaction: (t) => ({
            ...t,
            amount: new BigNumber(100),
            recipient: "dsadasdasdasdas",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: TransactionModule.fromTransactionRaw({
            family: "celo",
            recipient: LEDGER_CELO_ACCOUNT_2,
            amount: "0",
            mode: "send",
            fees: null,
            index: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: TransactionModule.fromTransactionRaw({
            family: "celo",
            recipient: LEDGER_CELO_ACCOUNT_2,
            amount: "399893159500000005",
            mode: "send",
            fees: null,
            index: 0,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "[send] use all amount - should warn all funds",
          transaction: (t) => ({
            ...t,
            useAllAmount: true,
            mode: "send",
            recipient: LEDGER_CELO_ACCOUNT_2,
          }),
          expectedStatus: (account) => ({
            errors: {},
            warnings: {
              amount: new CeloAllFundsWarning(),
            },
            totalSpent: account.spendableBalance,
          }),
        },
        {
          name: "Lock - success",
          transaction: (t) => ({
            ...t,
            mode: "lock",
            amount: new BigNumber(5000),
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {},
              warnings: {},
              amount: new BigNumber(5000),
            };
          },
        },
        {
          name: "Unlock - success",
          transaction: (t) => ({
            ...t,
            mode: "unlock",
            amount: new BigNumber(50000),
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {},
              warnings: {},
              amount: new BigNumber(50000),
            };
          },
        },
        {
          name: "Lock - amount required",
          transaction: (t) => ({
            ...t,
            mode: "lock",
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {
                amount: new AmountRequired(),
              },
              warnings: {},
            };
          },
        },
        {
          name: "Unlock - amount required",
          transaction: (t) => ({
            ...t,
            mode: "unlock",
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {
                amount: new AmountRequired(),
              },
              warnings: {},
            };
          },
        },
        {
          name: "Unlock - Not enough balance",
          transaction: (t) => ({
            ...t,
            mode: "unlock",
            amount: new BigNumber(200000000000000000),
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {
                amount: new NotEnoughBalance(),
              },
              warnings: {},
            };
          },
        },
        {
          name: "Vote - success",
          transaction: (t) => ({
            ...t,
            mode: "vote",
            useAllAmount: true,
            recipient: VALIDATOR_ACCOUNT_1,
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {},
              warnings: {},
              amount: new BigNumber(100000000000000000),
            };
          },
        },
        {
          name: "Vote - Not enough balance",
          transaction: (t) => ({
            ...t,
            mode: "vote",
            recipient: VALIDATOR_ACCOUNT_1,
            amount: new BigNumber(200000000000000000),
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {
                amount: new NotEnoughBalance(),
              },
              warnings: {},
            };
          },
        },
        {
          name: "Activate Vote - success",
          transaction: (t) => ({
            ...t,
            mode: "activate",
            recipient: VALIDATOR_ACCOUNT_1,
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {},
              warnings: {},
            };
          },
        },
        {
          name: "Revoke Vote - success",
          transaction: (t) => ({
            ...t,
            mode: "revoke",
            recipient: VALIDATOR_ACCOUNT_1,
            amount: new BigNumber(9000000),
            index: 0,
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {},
              warnings: {},
            };
          },
        },
        {
          name: "Revoke Vote - Not enough balance",
          transaction: (t) => ({
            ...t,
            mode: "revoke",
            recipient: VALIDATOR_ACCOUNT_1,
            amount: new BigNumber(20000000000000000000),
            index: 0,
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {
                amount: new NotEnoughBalance(),
              },
              warnings: {},
            };
          },
        },
        {
          name: "Revoke Vote - voted amount should be used when revoke amount is set",
          transaction: (t) => ({
            ...t,
            mode: "revoke",
            recipient: VALIDATOR_ACCOUNT_1,
            useAllAmount: true,
            index: 0,
          }),
          expectedStatus: (): Partial<TransactionStatusCommon> => {
            return {
              errors: {},
              warnings: {},
            };
          },
        },
      ],
    },
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:celo:${LEDGER_CELO_ACCOUNT_2}:`,
        seedIdentifier:
          "0453390dcc1e6f1be0fb34f837b278ed1b4c84097c7493c13a0d915c735af1d8aa445d2738a95e8f50bc22abd2e17cb868d4db22a623d99d861740eb93373d50a3",
        name: "Celo 1",
        derivationMode: "",
        index: 0,
        freshAddress: LEDGER_CELO_ACCOUNT_2,
        freshAddressPath: "44'/52752'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "celo",
        unitMagnitude: 18,
        lastSyncDate: "",
        balance: "399893159500000000",
        celoResources: {
          registrationStatus: false,
          lockedBalance: "0",
          nonvotingLockedBalance: "0",
          pendingWithdrawals: [],
          votes: [],
          electionAddress: "0x8D6677192144292870907E3Fa8A5527fE55A7ff6",
          lockedGoldAddress: "0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E",
        },
      } as AccountRaw,
      transactions: [
        {
          name: "Register Account - success",
          transaction: (t) => ({
            ...t,
            mode: "register",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
      ],
    },
  ],
};

export default dataset;
