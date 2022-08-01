import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import { MutationSpec } from "../../../bot/types";
import type { CeloAccount, Transaction } from "../types";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createActivateVoteMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Activate Vote",
  maxRun: 5,
  transaction: ({ account, bridge, maxSpendable }) => {
    const { celoResources } = account as CeloAccount;
    invariant(
      celoResources?.registrationStatus,
      "Celo: Activate Vote | Account is not registered"
    );
    invariant(
      maxSpendable.gt(minimalAmount),
      "Celo:  Activate Vote | balance is too low"
    );

    const activatableVote = celoResources?.votes?.find(
      (vote) => vote.activatable
    );

    invariant(!!activatableVote, "Celo: Activate Vote | No activatable votes");

    const transaction = {
      recipient: activatableVote!.validatorGroup,
    };

    return {
      transaction: bridge.createTransaction(account),
      updates: [
        {
          memo: "LedgerLiveBot",
          mode: "activate",
        },
        transaction,
      ],
    };
  },
});
