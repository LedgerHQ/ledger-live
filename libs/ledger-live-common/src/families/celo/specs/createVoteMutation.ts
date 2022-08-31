import invariant from "invariant";
import BigNumber from "bignumber.js";
import sampleSize from "lodash/sampleSize";
import { MutationSpec } from "../../../bot/types";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import { getCurrentCeloPreloadData } from "../preload";
import { getValidatorGroupsWithoutVotes } from "../logic";
import type { CeloAccount, CeloResources, Transaction } from "../types";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createVoteMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Vote",
  maxRun: 1,
  transaction: ({ account, bridge, maxSpendable }) => {
    invariant(
      maxSpendable.gt(minimalAmount),
      "Celo:  Vote | balance is too low"
    );

    const { celoResources } = account as CeloAccount;
    invariant(
      celoResources?.registrationStatus,
      "Celo: Vote | Account is not registered"
    );

    const nonvotingLockedBalance =
      celoResources?.nonvotingLockedBalance || new BigNumber(0);
    invariant(
      nonvotingLockedBalance.gt(0),
      "Celo: Vote | No non voting locked balance"
    );

    const votes = (celoResources as CeloResources).votes || [];
    const { validatorGroups } = getCurrentCeloPreloadData();

    // Get a random validator group that the account does not have locked tokens for.
    const validatorGroupWithoutVotes = sampleSize(
      getValidatorGroupsWithoutVotes(validatorGroups, votes),
      1
    )[0];

    const amount = nonvotingLockedBalance
      .times(0.5)
      .precision(8)
      .integerValue();

    invariant(amount.gt(0), "Celo: Vote | Not enough funds to vote");

    const transaction = {
      recipient: validatorGroupWithoutVotes.address,
      amount,
    };

    return {
      transaction: bridge.createTransaction(account),
      updates: [
        {
          memo: "LedgerLiveBot",
          mode: "vote",
        },
        transaction,
      ],
    };
  },
});
