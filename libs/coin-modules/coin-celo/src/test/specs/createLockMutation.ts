import invariant from "invariant";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { MutationSpec } from "@ledgerhq/coin-framework/bot/types";
import type { CeloAccount, Transaction } from "../../types";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.005");

export const createLockMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Lock",
  feature: "staking",
  maxRun: 1,
  transaction: ({ account, bridge, maxSpendable }) => {
    const { celoResources } = account as CeloAccount;
    invariant(celoResources?.registrationStatus, "Celo: Lock Vote | Account is not registered");

    invariant(maxSpendable.gt(minimalAmount), "Celo:  Lock | balance is too low");

    const amount = minimalAmount.times(Math.random()).integerValue().precision(8);

    invariant(amount.gt(0), "Celo: Lock | Not enough funds to lock tokens");

    const transaction = {
      amount,
    };

    return {
      transaction: bridge.createTransaction(account),
      updates: [
        {
          mode: "lock",
        },
        transaction,
      ],
    };
  },
});
