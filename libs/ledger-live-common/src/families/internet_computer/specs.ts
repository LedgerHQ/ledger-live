import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";

import type { Transaction } from "../../families/internet_computer/types";
import { getCryptoCurrencyById } from "../../currencies";
import { genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { acceptTransaction } from "./speculos-deviceActions";
// import { ICP_FEES } from "./consts";

const MIN_SAFE = new BigNumber(10);
const maxAccount = 6;

const internetComputerSpecs: AppSpec<Transaction> = {
  name: "InternetComputer",
  currency: getCryptoCurrencyById("internet_computer"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Internet Computer",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 6 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send minimum",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, maxAccount);
        let amount = MIN_SAFE;

        if (!sibling.used && amount.lt(MIN_SAFE)) {
          invariant(
            account.spendableBalance.gt(MIN_SAFE),
            "send is too low to activate account"
          );
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
    // {
    //   name: "Transfer Max",
    //   maxRun: 1,
    //   transaction: ({ account, siblings, bridge }) => {
    //     return {
    //       transaction: bridge.createTransaction(account),
    //       updates: [
    //         {
    //           recipient: pickSiblings(siblings, maxAccount).freshAddress,
    //         },
    //         {
    //           useAllAmount: true,
    //         },
    //       ],
    //     };
    //   },
    // },
  ],
};

export default {
  internetComputerSpecs,
};
