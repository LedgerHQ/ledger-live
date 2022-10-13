import reduce from "lodash/reduce";
import forEach from "lodash/forEach";
import type {
  Account,
  AccountLike,
  AccountLikeArray,
  SubAccount,
} from "@ledgerhq/types-live";

export type SearchResult = {
  account: AccountLike;
  parentAccount?: AccountLike;
  match?: boolean;
};

const flattenStructuredSearchResults = structuredResults =>
  reduce(
    structuredResults,
    (acc, account) => {
      acc.push(account);
      forEach(account.tokenAccounts, tokenAccount => {
        acc.push(tokenAccount);
      });
      return acc;
    },
    [],
  );

export const formatSearchResults = (
  searchResults: AccountLikeArray,
  accounts: AccountLike[],
): SearchResult[] => {
  const formated = reduce(
    searchResults,
    (acc, account: AccountLike) => {
      if (account.type === "Account") {
        if (!acc[account.id]) {
          acc[account.id] = {
            account,
            tokenAccounts: [],
          };
        }

        acc[account.id].match = true;
      } else {
        const parentId = account.parentId;
        const parentAccount = accounts.find((a: Account) => a.id === parentId);

        if (!acc[parentId]) {
          acc[parentId] = {
            account: parentAccount,
            tokenAccounts: [],
            match: false,
          };
        }

        acc[parentId].tokenAccounts = [
          ...acc[parentId].tokenAccounts,
          {
            account,
            match: true,
          },
        ];
      }

      return acc;
    },
    {},
  );
  return flattenStructuredSearchResults(formated);
};
export const formatSearchResultsTuples = (
  searchResults: {
    account: AccountLike;
    subAccount: SubAccount;
  }[],
): SearchResult[] => {
  const formated = reduce(
    searchResults,
    (acc, tuple) => {
      const accountId = tuple.subAccount
        ? tuple.subAccount.id
        : tuple.account.id;

      if (!acc[accountId]) {
        acc[accountId] = {
          account: tuple.subAccount || tuple.account,
          parentAccount: tuple.subAccount ? tuple.account : null,
          tokenAccounts: [],
        };
      }

      acc[accountId].match = true;
      return acc;
    },
    {},
  );
  return flattenStructuredSearchResults(formated);
};
