import { DeviceModelId } from "@ledgerhq/devices";
import type { MutationSpec, AppSpec } from "../../bot/types";
import type { Transaction } from "./types";
import { botTest, pickSiblings } from "../../bot/specs";
import { getCryptoCurrencyById } from "../../currencies";
import { acceptTransaction } from "./speculos-deviceActions";

const nervos: AppSpec<Transaction> = {
  name: "nervos",
  currency: getCryptoCurrencyById("nervos"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "nervos",
  },
  genericDeviceAction: acceptTransaction,
  mutations: [
    {
      name: "move ~50%",
      maxRun: 2,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;

        const transaction = bridge.createTransaction(account);

        const amount = maxSpendable
          .div(1.9 + 0.2 * Math.random())
          .integerValue();

        const updates = [{ amount }, { recipient }];
        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        botTest("account balance decreased with operation value", () =>
          expect(account.balance.toString()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toString()
          )
        );
      },
    },
  ] as MutationSpec<Transaction>[],
};

export default { nervos };
