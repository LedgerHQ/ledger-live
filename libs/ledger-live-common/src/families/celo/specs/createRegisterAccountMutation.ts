import invariant from "invariant";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import { MutationSpec } from "../../../bot/types";
import type { Transaction } from "../types";

const currency = getCryptoCurrencyById("celo");
const minimalAmount = parseCurrencyUnit(currency.units[0], "0.001");

export const createRegisterAccountMutation = (): MutationSpec<Transaction> => ({
  name: "Celo: Register Account",
  maxRun: 1,
  transaction: ({ account, bridge, maxSpendable }) => {
    const { celoResources } = account;

    invariant(
      !celoResources?.registrationStatus,
      "Celo: Register Account | Celo account is already registered"
    );
    invariant(
      maxSpendable.gt(minimalAmount),
      "Celo: Register Account | Celo account balance is too low to register account"
    );

    return {
      transaction: bridge.createTransaction(account),
      updates: [
        {
          memo: "LedgerLiveBot",
          mode: "register",
        },
      ],
    };
  },
});
