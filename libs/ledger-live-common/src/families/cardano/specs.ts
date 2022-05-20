import expect from "expect";
import type { AppSpec } from "../../bot/types";
import type { Transaction } from "./types";
import { pickSiblings } from "../../bot/specs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { DeviceModelId } from "@ledgerhq/devices";
import BigNumber from "bignumber.js";
import invariant from "invariant";

//TODO: need to run the test and update mutations as required after speculos flow in working condition

const cardano: AppSpec<Transaction> = {
  name: "cardano",
  currency: getCryptoCurrencyById("cardano"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "CardanoADA",
  },
  mutations: [
    {
      name: "move ~50%",
      maxRun: 1,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(0), "balance is too low");
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const updates = [
          { amount: new BigNumber(account.balance.dividedBy(2)).dp(0, 1) },
          { recipient },
        ];

        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation }): void => {
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        );
      },
    },
    {
      name: "send max",
      maxRun: 1,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);

        const updates = [{ useAllAmount: true }, { recipient }];

        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation }): void => {
        //TODO: add additional test to check operation amount
        expect(account.balance.toString()).toBe(
          accountBeforeTransaction.balance.minus(operation.value).toString()
        );
      },
    },
  ],
};

export default { cardano };
