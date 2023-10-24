import expect from "expect";
import invariant from "invariant";
import sampleSize from "lodash/sampleSize";
import { BigNumber } from "bignumber.js";
//FIXME
import { getCurrentPolkadotPreloadData } from "../bridge/preload";
import type { PolkadotAccount, PolkadotResources, Transaction } from "../types";
import {
  getCryptoCurrencyById,
  parseCurrencyUnit,
} from "@ledgerhq/coin-framework/currencies/index";
import {
  botTest,
  expectSiblingsHaveSpendablePartGreaterThan,
  genericTestDestination,
  pickSiblings,
} from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { toOperationRaw } from "@ledgerhq/coin-framework/account/index";
import {
  canBond,
  canUnbond,
  canNominate,
  isFirstBond,
  hasMinimumBondBalance,
  getMinimumBalance,
} from "../bridge/logic"; //FIXME
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";

const maxAccounts = 32;
const currency = getCryptoCurrencyById("polkadot");
// FIXME Should be replaced with EXISTENTIAL_DEPOSIT_RECOMMENDED_MARGIN in logic.ts
const POLKADOT_MIN_SAFE = parseCurrencyUnit(currency.units[0], "0.1");
// FIXME Should be replaced with EXISTENTIAL_DEPOSIT in logic.ts
const EXISTENTIAL_DEPOSIT = parseCurrencyUnit(currency.units[0], "1.0");
const MIN_LOCKED_BALANCE_REQ = parseCurrencyUnit(currency.units[0], "1.0");

const polkadot: AppSpec<Transaction> = {
  name: "Polkadot",
  currency: getCryptoCurrencyById("polkadot"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Polkadot",
  },
  testTimeout: 2 * 60 * 1000,
  genericDeviceAction: acceptTransaction,
  minViableAmount: POLKADOT_MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(POLKADOT_MIN_SAFE), "balance is too low");
  },
  test: ({ operation, optimisticOperation }) => {
    const opExpected: Record<string, any> = toOperationRaw({
      ...optimisticOperation,
    });
    delete opExpected.value;
    delete opExpected.fee;
    delete opExpected.date;
    delete opExpected.blockHash;
    delete opExpected.blockHeight;
    botTest("optimistic operation matches", () =>
      expect(toOperationRaw(operation)).toMatchObject(opExpected),
    );
  },
  mutations: [
    {
      name: "send 50%~",
      maxRun: 4,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge }) => {
        invariant((account as PolkadotAccount).polkadotResources, "polkadot resource");
        const sibling = pickSiblings(siblings, maxAccounts);
        let amount = account.spendableBalance
          .minus(EXISTENTIAL_DEPOSIT)
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        invariant(amount.gte(0), "not enough balance to do a transfer");

        if (sibling.balance.eq(0) && amount.lt(EXISTENTIAL_DEPOSIT)) {
          invariant(
            account.spendableBalance.gte(EXISTENTIAL_DEPOSIT.plus(POLKADOT_MIN_SAFE)),
            "send is too low to activate account",
          );
          amount = EXISTENTIAL_DEPOSIT;
        }

        const minimumBalanceExistential = getMinimumBalance(account);
        const leftover = account.spendableBalance.minus(amount.plus(POLKADOT_MIN_SAFE));
        if (
          minimumBalanceExistential.gt(0) &&
          leftover.lt(minimumBalanceExistential) &&
          leftover.gt(0)
        ) {
          throw new Error("risk of PolkadotDoMaxSendInstead");
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              amount,
            },
          ],
        };
      },
    },
    {
      name: "send max",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge }) => {
        invariant((account as PolkadotAccount).polkadotResources, "polkadot resources");
        const sibling = pickSiblings(siblings, maxAccounts);

        invariant(
          sibling.balance.eq(0) && account.spendableBalance.lte(EXISTENTIAL_DEPOSIT),
          "send is too low to activate account",
        );

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: sibling.freshAddress,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
    },
    {
      name: "bond - bondExtra",
      maxRun: 1,
      transaction: ({ siblings, account, bridge }) => {
        expectSiblingsHaveSpendablePartGreaterThan(siblings, 0.5);

        invariant((account as PolkadotAccount).polkadotResources, "polkadot");
        invariant(canBond(account), "can't bond");
        invariant(hasMinimumBondBalance(account as PolkadotAccount), "not enough balance to bond");
        const options: {
          recipient?: string;
          rewardDestination?: string;
          amount?: BigNumber;
        }[] = [];

        if (isFirstBond(account as PolkadotAccount)) {
          invariant(
            account.balance.gt(EXISTENTIAL_DEPOSIT.plus(POLKADOT_MIN_SAFE)),
            "cant cover fee + bonding amount",
          );
          options.push({
            recipient: account.freshAddress,
            rewardDestination: "Stash",
          });
          options.push({
            amount: EXISTENTIAL_DEPOSIT,
          });
        } else {
          invariant(
            account.spendableBalance.gt(POLKADOT_MIN_SAFE),
            "cant cover fee + bonding amount",
          );
          options.push({
            amount: new BigNumber(100000),
          });
        }

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "bond",
            },
            ...options,
          ],
        };
      },
    },
    {
      name: "unbond",
      maxRun: 2,
      transaction: ({ account, bridge }) => {
        const { polkadotResources } = account as PolkadotAccount;
        invariant(polkadotResources, "polkadot");
        invariant(canUnbond(account as PolkadotAccount), "can't unbond");
        invariant(account.spendableBalance.gt(POLKADOT_MIN_SAFE), "can't cover fee");
        const amount = (polkadotResources as PolkadotResources).lockedBalance
          .minus((polkadotResources as PolkadotResources).unlockingBalance)
          .times(0.2);
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "unbond",
            },
            {
              amount,
            },
          ],
        };
      },
    },
    {
      name: "rebond",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        const { polkadotResources } = account as PolkadotAccount;
        invariant(polkadotResources, "polkadot");
        invariant(polkadotResources?.unlockingBalance.gt(MIN_LOCKED_BALANCE_REQ), "can't rebond");
        invariant(account.spendableBalance.gt(POLKADOT_MIN_SAFE), "can't cover fee");
        const amount = BigNumber.maximum(
          (polkadotResources as PolkadotResources).unlockingBalance.times(0.2),
          MIN_LOCKED_BALANCE_REQ,
        );
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "rebond",
            },
            {
              amount,
            },
          ],
        };
      },
    },
    {
      name: "nominate",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant((account as PolkadotAccount).polkadotResources, "polkadot");
        invariant(canNominate(account as PolkadotAccount), "can't nominate");
        invariant(account.spendableBalance.gt(POLKADOT_MIN_SAFE), "cant cover fee");
        const data = getCurrentPolkadotPreloadData();
        const validators = sampleSize(
          data.validators.map(v => v.address),
          2,
        );
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "nominate",
            },
            ...validators.map((_, i) => ({
              validators: validators.slice(0, i + 1),
            })),
          ],
        };
      },
    },
    {
      name: "withdraw",
      maxRun: 2,
      transaction: ({ account, bridge }) => {
        const { polkadotResources } = account as PolkadotAccount;
        invariant(polkadotResources, "polkadot");
        invariant(polkadotResources?.unlockedBalance.gt(0), "nothing to withdraw");
        invariant(account.spendableBalance.gt(POLKADOT_MIN_SAFE), "can't cover fee");
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              mode: "withdrawUnbonded",
            },
          ],
        };
      },
    },
  ],
};

export default {
  polkadot,
};
