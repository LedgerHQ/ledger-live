import { BigNumber } from "bignumber.js";
import { InvalidAddressBecauseDestinationIsAlsoSource, NotEnoughBalance } from "@ledgerhq/errors";
import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import {
  NearNewAccountWarning,
  NearNewNamedAccountError,
  NearActivationFeeNotCovered,
  NearRecommendUnstake,
  NearStakingThresholdNotMet,
  NearNotEnoughStaked,
  NearNotEnoughAvailable,
  NearUseAllAmountStakeWarning,
} from "../../errors";

const ACCOUNT_ADDRESS = "18d68decb70d4d4fd267d19a0d25edc06ad079e69ded41233a10976cf36391ec";
const ACTIVE_RECIPIENT_ADDRESS = "3cfb4df771c29cf040e2534b71b4df08b6232e7248aefc7decf45d2b40f80ad5";
const INACTIVE_RECIPIENT_ADDRESS =
  "6cbf3b0f8d8b4667bf64bf44b4fefa830e4cef0e5da1e5cfb4015b5a755c4ac0";
const VALIDATOR_ADDRESS = "figment.poolv1.near";
const DEFAULT_AMOUNT = "100000000";
const BIG_AMOUNT = "1000000000000000000000000";

const near: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "near seed 1",
      apdus: `
      => 80040157148000002c8000018d800000008000000080000000
      <= 18d68decb70d4d4fd267d19a0d25edc06ad079e69ded41233a10976cf36391ec9000
      => 80040157148000002c8000018d800000008000000080000001
      <= 6cbf3b0f8d8b4667bf64bf44b4fefa830e4cef0e5da1e5cfb4015b5a755c4ac09000
      => 80040157148000002c8000018d800000008000000080000002
      <= 59dff1cf9185758c0c2f878c37a175280f3967dca8fee6e4ad0c4aa26daf8e5c9000
      `,
    },
  ],
  accounts: [
    {
      // Skipping due to rewards being auto-compounded, no operation as evidence
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:near:${ACCOUNT_ADDRESS}:nearbip44h`,
        seedIdentifier: `${ACCOUNT_ADDRESS}`,
        name: "NEAR 1",
        derivationMode: "nearbip44h",
        index: 0,
        freshAddress: `${ACCOUNT_ADDRESS}`,
        freshAddressPath: "44'/397'/0'/0'/0'",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "near",
        unitMagnitude: 24,
        lastSyncDate: "",
        balance: "47162281393064900000001",
      },
      transactions: [
        {
          name: "Recipient and sender must not be the same",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: ACCOUNT_ADDRESS,
            amount: DEFAULT_AMOUNT,
            mode: "send",
          }),
          expectedStatus: {
            amount: new BigNumber(DEFAULT_AMOUNT),
            errors: {},
            warnings: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: ACTIVE_RECIPIENT_ADDRESS,
            amount: BIG_AMOUNT,
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "New implicit account",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: INACTIVE_RECIPIENT_ADDRESS,
            amount: DEFAULT_AMOUNT,
            mode: "send",
          }),
          expectedStatus: {
            errors: {},
            warnings: {
              recipient: new NearNewAccountWarning(),
            },
          },
        },
        {
          name: "New named account",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: "brand-new-account-8172987103.near",
            amount: DEFAULT_AMOUNT,
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              recipient: new NearNewNamedAccountError(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount does not cover activation fee",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: INACTIVE_RECIPIENT_ADDRESS,
            amount: DEFAULT_AMOUNT,
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              amount: new NearActivationFeeNotCovered(),
            },
            warnings: {},
          },
        },
        {
          name: "Send max with active staking positions",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: ACTIVE_RECIPIENT_ADDRESS,
            amount: DEFAULT_AMOUNT,
            useAllAmount: true,
            mode: "send",
          }),
          expectedStatus: {
            errors: {},
            warnings: {
              amount: new NearRecommendUnstake(),
            },
          },
        },
        {
          name: "Staking threshold not met",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: VALIDATOR_ADDRESS,
            amount: "1",
            mode: "stake",
          }),
          expectedStatus: {
            errors: {
              amount: new NearStakingThresholdNotMet(),
            },
            warnings: {},
          },
        },
        {
          name: "Unstaking more than is staked",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: VALIDATOR_ADDRESS,
            amount: BIG_AMOUNT,
            mode: "unstake",
          }),
          expectedStatus: {
            errors: {
              amount: new NearNotEnoughStaked(),
            },
            warnings: {},
          },
        },
        {
          name: "Withdrawing more than is unstaked",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: VALIDATOR_ADDRESS,
            amount: BIG_AMOUNT,
            mode: "withdraw",
          }),
          expectedStatus: {
            errors: {
              amount: new NearNotEnoughAvailable(),
            },
            warnings: {},
          },
        },
        {
          name: "Staking max",
          transaction: fromTransactionRaw({
            family: "near",
            recipient: VALIDATOR_ADDRESS,
            amount: DEFAULT_AMOUNT,
            useAllAmount: true,
            mode: "stake",
          }),
          expectedStatus: {
            errors: {},
            warnings: {
              amount: new NearUseAllAmountStakeWarning(),
            },
          },
        },
      ],
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    near,
  },
};

testBridge(dataset);
