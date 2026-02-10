import { botTest, genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { AccountType, BotScenario } from "../bridge/utils";
import type { Transaction } from "../types";
import { generateDeviceActionFlow } from "./speculos-deviceActions";

const F4_RECIPIENT = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const ETH_RECIPIENT = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";
const MIN_SAFE = new BigNumber(100000);
const maxAccount = 6;

const filecoinSpecs: AppSpec<Transaction> = {
  name: "Filecoin",
  currency: getCryptoCurrencyById("filecoin"),
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Filecoin",
    appVersion: "0.24.5",
    firmware: "1.3.1",
  },
  genericDeviceAction: generateDeviceActionFlow(BotScenario.DEFAULT),
  testTimeout: 16 * 60 * 1000,
  minViableAmount: MIN_SAFE,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(MIN_SAFE), "balance is too low");
  },
  mutations: [
    {
      name: "Send small to f4 address",
      feature: "send",
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
      feature: "send",
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
      feature: "send",
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
      feature: "sendMax",
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
    {
      name: "Send ~50% WFIL",
      feature: "tokens",
      maxRun: 1,
      deviceAction: generateDeviceActionFlow(BotScenario.TOKEN_TRANSFER),
      transaction: ({ account, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "Spendable balance is too low");
        const subAccount = account.subAccounts?.find(
          a => a.type === AccountType.TokenAccount && a.spendableBalance.gt(0),
        );
        invariant(
          subAccount && subAccount.type === AccountType.TokenAccount,
          "no subAccount with WFIL",
        );
        const amount = subAccount.balance.div(1.9 + 0.2 * Math.random()).integerValue();
        return {
          transaction: bridge.createTransaction(account),
          updates: [
            {
              subAccountId: subAccount.id,
            },
            {
              recipient: F4_RECIPIENT,
            },
            {
              amount,
            },
          ],
        };
      },
      test: ({ account, accountBeforeTransaction, transaction, status }) => {
        const subAccountId = transaction.subAccountId;
        const subAccount = account.subAccounts?.find(sa => sa.id === subAccountId);
        const subAccountBeforeTransaction = accountBeforeTransaction.subAccounts?.find(
          sa => sa.id === subAccountId,
        );
        botTest("subAccount balance moved with the tx status amount", () =>
          expect(subAccount?.balance.toString()).toBe(
            subAccountBeforeTransaction?.balance.minus(status.amount).toString(),
          ),
        );
      },
    },
  ],
};

export default {
  filecoinSpecs,
};
