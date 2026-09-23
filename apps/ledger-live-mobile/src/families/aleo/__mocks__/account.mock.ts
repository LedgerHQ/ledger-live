import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type {
  AleoAccount,
  AleoResources,
  AleoTokenAccount,
} from "@ledgerhq/live-common/families/aleo/types";
import { aleoCurrency, aleoTokenCurrency } from "./currency.mock";

const baseAccount1 = {
  ...genAccount("aleo-1", { currency: aleoCurrency }),
  index: 0,
};

export const ALEO_TOKEN_ACCOUNT_1: AleoTokenAccount = {
  ...(genTokenAccount(0, baseAccount1, aleoTokenCurrency) as AleoTokenAccount),
  transparentBalance: new BigNumber(500_000),
  privateBalance: new BigNumber(300_000),
  unspentPrivateRecords: null,
};

export const ALEO_ACCOUNT_1: AleoAccount = {
  ...baseAccount1,
  subAccounts: [ALEO_TOKEN_ACCOUNT_1],
};
export const ALEO_ACCOUNT_2: AleoAccount = {
  ...genAccount("aleo-2", { currency: aleoCurrency }),
  index: 1,
};

export const makeAleoAccount = (
  resources: Partial<AleoResources>,
  overrides: Partial<AleoAccount> = {},
): AleoAccount => ({
  ...ALEO_ACCOUNT_1,
  aleoResources: {
    transparentBalance: new BigNumber(0),
    provableApi: null,
    privateBalance: null,
    unspentPrivateRecords: null,
    lastPrivateSyncDate: null,
    ...resources,
  },
  ...overrides,
});

let currencyIdCounter = 0;

// `useAleoValidators` keeps a module-level render seed per currency id, so a test isolating a
// committee fetch needs its own id or it would be handed a previous render's cached result.
export function withFreshCurrencyId(account: AleoAccount): AleoAccount {
  return {
    ...account,
    currency: {
      ...account.currency,
      id: `aleo_test_${currencyIdCounter++}` as AleoAccount["currency"]["id"],
    },
  };
}
