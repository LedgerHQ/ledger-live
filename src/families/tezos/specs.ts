// @flow
import sample from "lodash/sample";
import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { getAccountDelegationSync } from "./bakers";
import whitelist from "./bakers.whitelist-default";

const maxAccount = 12;

function expectUnrevealed(account) {
  invariant(
    account.tezosResources?.revealed === false,
    "account must be unreleaved"
  );
}
function expectRevealed(account) {
  invariant(
    account.tezosResources?.revealed === true,
    "account must be releaved"
  );
}

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
      name: "send unrevealed",
      maxRun: 1,
      transaction: ({ maxSpendable, account, siblings, bridge }) => {
        expectUnrevealed(account);
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient, amount }],
        };
      },
    },
    {
      name: "send revealed",
      maxRun: 2,
      transaction: ({ maxSpendable, account, siblings, bridge }) => {
        expectRevealed(account);
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient, amount }],
        };
      },
    },
    {
      name: "send max",
      maxRun: 3,
      transaction: ({ account, siblings, bridge }) => {
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient, useAllAmount: true }],
        };
      },
    },
    {
      name: "delegate unrevealed",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        expectUnrevealed(account);
        const recipient = sample(whitelist);
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient, mode: "delegate" }],
        };
      },
    },
    {
      name: "delegate revealed",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        expectRevealed(account);
        const recipient = sample(whitelist);
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient, mode: "delegate" }],
        };
      },
    },
    {
      name: "undelegate unrevealed",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant(
          getAccountDelegationSync(account),
          "account must be delegating"
        );
        expectUnrevealed(account);
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "undelegate" }],
        };
      },
    },
    {
      name: "undelegate revealed",
      maxRun: 1,
      transaction: ({ account, bridge }) => {
        invariant(
          getAccountDelegationSync(account),
          "account must be delegating"
        );
        expectRevealed(account);
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ mode: "undelegate" }],
        };
      },
    },
  ],
};

export default {
  tezos,
};
