import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import { MutationSpec } from "../../../bot/types";
import type { CeloAccount, Transaction } from "../types";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createRevokeVoteMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: RevokeVote",
  maxRun: 5,
  transaction: ({ account, bridge, maxSpendable }) => {
    invariant(
      maxSpendable.gt(minimalAmount),
      "Celo:  Revoke Vote | balance is too low"
    );

    const { celoResources } = account as CeloAccount;
    invariant(
      celoResources?.registrationStatus,
      "Celo: RevokeVote | Account is not registered"
    );

    const revokableVote = celoResources?.votes?.find((vote) => vote.revokable);

    invariant(!!revokableVote, "Celo: RevokeVote |  Revokable vote not found");

    return {
      transaction: bridge.createTransaction(account),
      updates: [
        {
          memo: "LedgerLiveBot",
          mode: "revoke",
          recipient: revokableVote!.validatorGroup,
          group: revokableVote!.validatorGroup,
          address: (account as CeloAccount).celoResources?.electionAddress,
          index: revokableVote!.index,
          amount: revokableVote!.amount,
        },
      ],
    };
  },
});
