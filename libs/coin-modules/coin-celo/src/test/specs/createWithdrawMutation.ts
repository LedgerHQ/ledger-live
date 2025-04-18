import invariant from "invariant";
import { MutationSpec } from "@ledgerhq/coin-framework/bot/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { availablePendingWithdrawals } from "../../logic";
import type { CeloAccount, Transaction } from "../../types";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createWithdrawMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Withdraw",
  feature: "staking",
  maxRun: 1,
  transaction: ({ account, bridge, maxSpendable }) => {
    const celoAccount = account as CeloAccount;
    const { celoResources } = celoAccount;
    invariant(celoResources?.registrationStatus, "Celo: Withdraw | Account is not registered");

    const pendingWithdrawals = availablePendingWithdrawals(celoAccount);

    invariant(pendingWithdrawals.length > 0, "Celo: Withdraw | No withdrawable balance");

    invariant(maxSpendable.gt(minimalAmount), "Celo:  Withdraw Vote | balance is too low");

    return {
      transaction: bridge.createTransaction(celoAccount),
      updates: [
        {
          mode: "withdraw",
          recipient: celoAccount.celoResources!.lockedGoldAddress!,
          index: pendingWithdrawals[0].index,
        },
      ],
    };
  },
});
