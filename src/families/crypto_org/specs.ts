import invariant from "invariant";
import type { Transaction } from "./types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../currencies";
import { pickSiblings } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { DeviceModelId } from "@ledgerhq/devices";

// this spec defines a set of "rules" that the bot will follow
// to accumulate transactions on accounts.
// right now, it will rotate the funds among 3 accounts by doing a 50% send each run.
// TODO: more cases to cover
// TODO: more assertions could be written

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
];

const crypto_org_croeseid: AppSpec<Transaction> = {
  name: "Crypto.org Testnet",
  currency: getCryptoCurrencyById("crypto_org_croeseid"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Crypto.orgChain",
  },
  testTimeout: 4 * 60 * 1000,
  transactionCheck: ({ maxSpendable }) => {
    invariant(
      maxSpendable.gt(
        parseCurrencyUnit(
          getCryptoCurrencyById("crypto_org_croeseid").units[0],
          "0.01"
        )
      ),
      "balance is too low"
    );
  },
  mutations: sharedMutations({ maxAccount: 3 }),
};

export default {
  crypto_org_croeseid,
};
