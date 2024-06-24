import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { Account } from "@ledgerhq/types-live";
import { accountDataToAccount } from "../../../liveqr/cross";

type LocalState = {
  list: Account[];
};

export const emptyState: LocalState = {
  list: [],
};

export const genState = (index: number) => {
  const list = Array(index + 1)
    .fill(null)
    .map((_, i) =>
      genAccount(`walletmocks-${i}`, {
        swapHistorySize: 0,
        operationsSize: 0,
        subAccountsCount: 0,
      }),
    );

  // we remove some of the accounts in order to create intersection of possibilities (to cover removed account cases)
  let skipEach = 2;
  for (let i = skipEach; i < list.length; i += skipEach) {
    list.splice(i, 1);
    skipEach++;
  }

  return { list };
};

export const convertLocalToDistantState = (localState: { list: Account[] }) =>
  localState.list.map(convertAccountToDescriptor);

export const convertDistantToLocalState = (distantState: AccountDescriptor[]) => ({
  list: distantState.map(convertDescriptorToAccount),
});

// we make this type static because the module is not supposed to change it over time!
type AccountDescriptor = {
  id: string;
  currencyId: string;
  freshAddress: string;
  seedIdentifier: string;
  derivationMode: string;
  index: number;
};

function convertAccountToDescriptor(account: Account): AccountDescriptor {
  return {
    id: account.id,
    currencyId: account.currency.id,
    freshAddress: account.freshAddress,
    seedIdentifier: account.seedIdentifier,
    derivationMode: account.derivationMode,
    index: account.index,
  };
}

function convertDescriptorToAccount(descriptor: AccountDescriptor): Account {
  // NB: this is the current implementation of the module giving the account state before it has opportunity to update, may change over time
  return accountDataToAccount({ ...descriptor, balance: "0", name: "" })[0];
}

export const similarLocalState = (a: LocalState, b: LocalState) => {
  return (
    a.list
      .map(a => a.id)
      .sort()
      .join(" ") ===
    b.list
      .map(a => a.id)
      .sort()
      .join(" ")
  );
};
