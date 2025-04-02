import invariant from "invariant";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { MutationSpec } from "@ledgerhq/coin-framework/lib-es/bot/types";
import type { CeloAccount, Transaction } from "../../src/types";
import BigNumber from "bignumber.js";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createUnlockMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Unlock",
  feature: "staking",
  maxRun: 1,
  transaction: ({ account, bridge, maxSpendable }) => {
    invariant(maxSpendable.gt(minimalAmount), "Celo:  Unlock | balance is too low");

    const { celoResources } = account as CeloAccount;
    invariant(celoResources?.registrationStatus, "Celo: Unlock | Account is not registered");
    const nonvotingLockedBalance = celoResources?.nonvotingLockedBalance || new BigNumber(0);
    invariant(nonvotingLockedBalance.gt(0), "Celo: Unlock | No non voting locked balance");

    return {
      transaction: bridge.createTransaction(account),
      updates: [
        {
          mode: "unlock",
        },
        {
          amount: nonvotingLockedBalance.dividedBy(2).integerValue(),
        },
      ],
    };
  },
});
