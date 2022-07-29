import invariant from "invariant";
import { MutationSpec } from "../../../bot/types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import { availablePendingWithdrawals } from "../logic";
import type { Transaction } from "../types";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createWithdrawMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Withdraw",
  maxRun: 5,
  transaction: ({ account, bridge, maxSpendable }) => {
    const { celoResources } = account;
    invariant(
      celoResources?.registrationStatus,
      "Celo: Withdraw | Account is not registered"
    );

    const pendingWithdrawals = availablePendingWithdrawals(account);
    invariant(
      pendingWithdrawals.length > 0,
      "Celo: Withdraw | No withdrawable balance"
    );

    invariant(
      maxSpendable.gt(minimalAmount),
      "Celo:  Withdraw Vote | balance is too low"
    );

    const transaction = {
      recipient: account.celoResources!.lockedGoldAddress!,
      index: pendingWithdrawals[0].index,
    };

    return {
      transaction: bridge.createTransaction(account),
      updates: [
        {
          memo: "LedgerLiveBot",
          mode: "withdraw",
        },
        transaction,
      ],
    };
  },
});
