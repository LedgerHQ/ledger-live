// @flow

import reduce from "lodash/reduce";
import forEach from "lodash/forEach";
import type {
  Account,
  AccountLike,
  AccountLikeArray,
} from "@ledgerhq/live-common/types/account";

export type SearchResult = {
  account: AccountLike,
  match?: boolean,
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
  accounts: Account[],
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
        if (!acc[account.parentId]) {
          acc[account.parentId] = {
            account: parentAccount,
            tokenAccounts: [],
            match: false,
          };
        }
        acc[account.parentId].tokenAccounts = [
          ...acc[account.parentId].tokenAccounts,
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
