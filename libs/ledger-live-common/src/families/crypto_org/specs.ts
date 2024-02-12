import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { acceptTransaction } from "./speculos-deviceActions";

const minAmount = parseCurrencyUnit(getCryptoCurrencyById("crypto_org").units[0], "0.01");
const transactionCheck = ({ maxSpendable }) => {
  invariant(maxSpendable.gt(minAmount), "balance is too low");
};

const sharedMutations = ({ maxAccount }) => [
  {
    name: "move 50%",
    maxRun: 2,
    transaction: ({ account, siblings, bridge }) => {
      const sibling = pickSiblings(siblings, maxAccount);
      const recipient = sibling.freshAddress;
      const amount = account.balance.div(2).integerValue();
      return {
        transaction: bridge.createTransaction(account),
        updates: [{ recipient, amount }],
      };
    },
  },
  {
    name: "send max",
    maxRun: 2,
    transaction: ({ account, siblings, bridge }) => {
      const sibling = pickSiblings(siblings, maxAccount);
      const recipient = sibling.freshAddress;

      return {
        transaction: bridge.createTransaction(account),
        updates: [{ recipient }, { useAllAmount: true }],
      };
    },
  },
];

const crypto_org_croeseid: AppSpec<Transaction> = {
  disabled: true, // explorers are not correctly working. we will focus on crypto_org spec for now
  name: "Crypto org Testnet",
  currency: getCryptoCurrencyById("crypto_org_croeseid"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Crypto.orgChain",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 4 * 60 * 1000,
  minViableAmount: minAmount,
  transactionCheck,
  mutations: sharedMutations({ maxAccount: 5 }),
};

const crypto_org: AppSpec<Transaction> = {
  name: "Crypto org",
  currency: getCryptoCurrencyById("crypto_org"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Crypto.orgChain",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 4 * 60 * 1000,
  minViableAmount: minAmount,
  transactionCheck,
  mutations: sharedMutations({ maxAccount: 5 }),
};

export default {
  crypto_org_croeseid,
  crypto_org,
};
