import invariant from "invariant";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";

import type { Transaction } from "../../families/filecoin/types";
import { getCryptoCurrencyById } from "../../currencies";
import { genericTestDestination, pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { generateDeviceActionFlow } from "./speculos-deviceActions";
import { BotScenario } from "./utils";

const F4_RECIPIENT = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const ETH_RECIPIENT = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";
const MIN_SAFE = new BigNumber(100000);
const maxAccount = 6;

const filecoinSpecs: AppSpec<Transaction> = {
  name: "Filecoin",
  currency: getCryptoCurrencyById("filecoin"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Filecoin",
  },
  genericDeviceAction: generateDeviceActionFlow(BotScenario.DEFAULT),
  testTimeout: 6 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send small to f4 address",
      maxRun: 1,
      deviceAction: generateDeviceActionFlow(BotScenario.F4_RECIPIENT),
      testDestination: genericTestDestination,
      transaction: ({ account, bridge }) => {
        const amount = new BigNumber("100");

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: F4_RECIPIENT,
            },
            {
              amount,
            },
          ],
        };
      },
    },
    {
      name: "Send small to eth address",
      maxRun: 1,
      deviceAction: generateDeviceActionFlow(BotScenario.ETH_RECIPIENT),
      testDestination: genericTestDestination,
      transaction: ({ account, bridge }) => {
        const amount = new BigNumber("100");

        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              recipient: ETH_RECIPIENT,
            },
            {
              amount,
            },
          ],
        };
      },
    },
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
