import expect from "expect";
import type {
  AppSpec,
  TransactionArg,
  TransactionRes,
  TransactionTestInput,
} from "../../bot/types";
import type { Transaction } from "./types";
import { pickSiblings, botTest } from "../../bot/specs";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import deviceAction from "../vechain/speculos-deviceActions";

const VeChain: AppSpec<Transaction> = {
  name: "Vechain",
  currency: getCryptoCurrencyById("vechain"),
  appQuery: {
    model: DeviceModelId.nanoS,
    appName: "Vechain",
    appVersion: "1.0.7",
    firmware: "1.0.3",
  },
  genericDeviceAction: deviceAction.acceptTransaction,
  mutations: [
    {
      name: "move ~50%",
      maxRun: 2,
      transaction: ({
        account,
        siblings,
        bridge,
        maxSpendable,
      }: TransactionArg<Transaction>): TransactionRes<Transaction> => {
        const sibling = pickSiblings(siblings, 4);
        const recipient = sibling.freshAddress;
        const transaction = bridge.createTransaction(account);
        const amount = maxSpendable.div(2).integerValue();
        //checkSendableToEmptyAccount(amount, sibling);
        const updates = [{ amount }, { recipient }];
        return {
          transaction,
          updates,
        };
      },
      test: ({
        account,
        accountBeforeTransaction,
        operation,
      }: TransactionTestInput<Transaction>): void | undefined => {
        botTest("account balance decreased with operation value", () =>
          expect(account.balance.toString()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toString()
          )
        );
      },
    },
  ],
};

export default { VeChain };
