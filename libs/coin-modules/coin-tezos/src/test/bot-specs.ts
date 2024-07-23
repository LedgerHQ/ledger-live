import sample from "lodash/sample";
import invariant from "invariant";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { genericTestDestination, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { isTezosAccount, type Transaction } from "../types";
import { getAccountDelegationSync, isAccountDelegating } from "../network/bakers";
import whitelist from "../network/bakers.whitelist-default";
import { acceptTransaction } from "./bot-deviceActions";
import { Account } from "@ledgerhq/types-live";

const maxAccount = 12;

function expectUnrevealed(account: Account) {
  if (!isTezosAccount(account)) throw Error("Not TezosAccount type");
  invariant(account.tezosResources?.revealed === false, "account must be unreleaved");
}
function expectRevealed(account: Account) {
  if (!isTezosAccount(account)) throw Error("Not TezosAccount type");
  invariant(account.tezosResources?.revealed === true, "account must be releaved");
}

const tezosUnit = getCryptoCurrencyById("tezos").units[0];

const safeMinimumForDestinationNotCreated = parseCurrencyUnit(tezosUnit, "0.6");
const strictMin = parseCurrencyUnit(tezosUnit, "0.02");

const tezos: AppSpec<Transaction> = {
  name: "Tezos",
  currency: getCryptoCurrencyById("tezos"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "TezosWallet",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 2 * 60 * 1000,
  minViableAmount: strictMin,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(strictMin), "balance is too low");
  },
  mutations: [
    {
      name: "send unrevealed",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ maxSpendable, account, siblings, bridge }) => {
        expectUnrevealed(account);
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        if (sibling.balance.eq(0) && amount.lt(safeMinimumForDestinationNotCreated)) {
          throw new Error("need more funds to send to new address");
        }
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient, amount }],
        };
      },
    },
    {
      name: "send revealed",
      maxRun: 2,
      testDestination: genericTestDestination,
      transaction: ({ maxSpendable, account, siblings, bridge }) => {
        expectRevealed(account);
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();
        if (sibling.balance.eq(0) && amount.lt(safeMinimumForDestinationNotCreated)) {
          throw new Error("need more funds to send to new address");
        }
        return {
          transaction: bridge.createTransaction(account),
          updates: [{ recipient, amount }],
        };
      },
    },
    {
      name: "send max (non delegating)",
      maxRun: 3,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(!isAccountDelegating(account), "account must not be delegating");
        const sibling = pickSiblings(siblings, maxAccount);
        const recipient = sibling.freshAddress;
        if (sibling.balance.eq(0) && maxSpendable.lt(safeMinimumForDestinationNotCreated)) {
          throw new Error("need more funds to send to new address");
        }
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
        const d = getAccountDelegationSync(account);
        const recipient = sample(d ? whitelist.filter(w => w !== d.address) : whitelist);
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
        const d = getAccountDelegationSync(account);
        const recipient = sample(d ? whitelist.filter(w => w !== d.address) : whitelist);
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
        invariant(getAccountDelegationSync(account), "account must be delegating");
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
        invariant(getAccountDelegationSync(account), "account must be delegating");
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
