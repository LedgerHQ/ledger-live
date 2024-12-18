import invariant from "invariant";
import expect from "expect";
// import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
// import { isAccountEmpty } from "@ledgerhq/coin-framework/account";
// import { AccountLike } from "@ledgerhq/types-live";
import { genericTestDestination, pickSiblings, botTest } from "../../bot/specs";
import type { AppSpec } from "../../bot/types";
import { acceptTransaction } from "./speculos-deviceActions";
import type { Transaction } from "./types";
import { log } from "@ledgerhq/logs";

const currency = getCryptoCurrencyById("aptos");
const minAmountCutoff = parseCurrencyUnit(currency.units[0], "0.0001");
// const reserve = parseCurrencyUnit(currency.units[0], "0.5");
const maxAccountSiblings = 4;

log("MINAMOUNTCUTOFF", minAmountCutoff.toString());

// function randomIntFromInterval(min, max): string {
//   const minBig = new BigNumber(min);
//   const maxBig = new BigNumber(max);

//   const random = BigNumber.random().multipliedBy(maxBig.minus(minBig).plus(1)).plus(minBig);
//   const randomInt = random.integerValue(BigNumber.ROUND_FLOOR);

//   return randomInt.toString();
// }

// function getRandomTransferID(): string {
//   return randomIntFromInterval(0, Number.MAX_SAFE_INTEGER);
// }

const aptos: AppSpec<Transaction> = {
  name: "Aptos",
  currency,
  appQuery: {
    model: DeviceModelId.nanoSP,
    appName: "Aptos",
  },
  genericDeviceAction: acceptTransaction,
  testTimeout: 1000,
  minViableAmount: minAmountCutoff,
  transactionCheck: ({ maxSpendable }) => {
    invariant(maxSpendable.gt(minAmountCutoff), "balance is too low");
  },
  mutations: [
    {
      name: "Send ~50%",
      maxRun: 1,
      testDestination: genericTestDestination,
      transaction: ({ account, siblings, bridge, maxSpendable }) => {
        invariant(maxSpendable.gt(minAmountCutoff), "balance is too low");

        const sibling = pickSiblings(siblings, maxAccountSiblings);
        const recipient = sibling.freshAddress;
        const amount = maxSpendable.div(2).integerValue();

        const transaction = bridge.createTransaction(account);
        const updates: Array<Partial<Transaction>> = [
          {
            recipient,
          },
          { amount },
        ];

        // if (Math.random() < 0.5) {
        //   updates.push({
        //     transferId: getRandomTransferID(),
        //   });
        // }

        return {
          transaction,
          updates,
        };
      },
      test: ({ account, accountBeforeTransaction, operation }) => {
        botTest("account balance moved with operation.value", () =>
          expect(account.balance.toString()).toBe(
            accountBeforeTransaction.balance.minus(operation.value).toString(),
          ),
        );
      },
    },
  ],
};

export default { aptos };
