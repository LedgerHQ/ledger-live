import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";

import type { Transaction } from "../../families/filecoin/types";
import { getCryptoCurrencyById } from "../../currencies";
import { genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { acceptTransaction } from "./speculos-deviceActions";

const MIN_SAFE = new BigNumber(100000);
const maxAccount = 6;

const filecoinSpecs: AppSpec<Transaction> = {
  name: "Filecoin",
  currency: getCryptoCurrencyById("filecoin"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Filecoin",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 6 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send 50%~",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, maxAccount);
        let amount = account.spendableBalance.div(1.9 + 0.2 * Math.random()).integerValue();

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
  filecoinSpecs,
};
