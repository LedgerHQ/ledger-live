import invariant from "invariant";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { MutationSpec } from "@ledgerhq/coin-framework/bot/types";
import type { CeloAccount, Transaction } from "../../types";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createActivateVoteMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Activate Vote",
  feature: "staking",
  maxRun: 1,
  transaction: ({ account, bridge, maxSpendable }) => {
    const { celoResources } = account as CeloAccount;
    invariant(celoResources?.registrationStatus, "Celo: Activate Vote | Account is not registered");
    invariant(maxSpendable.gt(minimalAmount), "Celo:  Activate Vote | balance is too low");

    const activatableVote = celoResources?.votes?.find(vote => vote.activatable);

    invariant(!!activatableVote, "Celo: Activate Vote | No activatable votes");

    const transaction = {
      recipient: activatableVote!.validatorGroup,
    };

    return {
      transaction: bridge.createTransaction(account),
      updates: [
        {
          mode: "activate",
        },
        transaction,
      ],
    };
  },
});
