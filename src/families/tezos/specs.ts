// @flow
import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";

const maxAccount = 8;

const tezos: AppSpec<Transaction> = {
  name: "Tezos",
  currency: getCryptoCurrencyById("tezos"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "TezosWallet",
  },
  transactionCheck: ({ maxSpendable }) => {
    invariant(
      maxSpendable.gt(
        parseCurrencyUnit(getCryptoCurrencyById("tezos").units[0], "0.1")
      ),
      "balance is too low"
    );
  },
  mutations: [
    {
      name: "move 50%",
      maxRun: 2,
      transaction: ({ maxSpendable, account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient, amount }],
        };
      },
    },
  ],
};

export default {
  tezos,
};
