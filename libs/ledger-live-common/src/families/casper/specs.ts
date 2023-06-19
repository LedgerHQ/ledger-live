import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";

import type { Transaction } from "../../families/casper/types";
import { getCryptoCurrencyById } from "../../currencies";
import { genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { acceptTransaction } from "./speculos-deviceActions";
import { CASPER_MINIMUM_VALID_AMOUNT } from "./consts";

const MIN_SAFE = new BigNumber(CASPER_MINIMUM_VALID_AMOUNT);
const maxAccount = 6;

// TODO Prateek: test and add test field
const casperSpecs: AppSpec<Transaction> = {
  name: "Casper",
  currency: getCryptoCurrencyById("casper"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "casper",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 6 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      // TODO Prateek: Use 50% instead of minimum
      name: "Send Minimum",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, maxAccount);
        // let amount = account.spendableBalance.div(2).integerValue();
        let amount = new BigNumber(CASPER_MINIMUM_VALID_AMOUNT);

        if (!sibling.used && amount.lt(MIN_SAFE)) {
          invariant(account.spendableBalance.gt(MIN_SAFE), "send is too low to activate account");
          amount = MIN_SAFE;
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
      name: "Transfer Max",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: pickSiblings(siblings, maxAccount).freshAddress,
            },
            {
              useAllAmount: true,
            },
          ],
        };
      },
    },
  ],
};

export default {
  casperSpecs,
};
