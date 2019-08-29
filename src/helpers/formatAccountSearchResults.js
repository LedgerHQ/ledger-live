// @flow

import reduce from "lodash/reduce";
import forEach from "lodash/forEach";
import type {
  Account,
  TokenAccount,
} from "@ledgerhq/live-common/lib/types/account";

export type SearchResult = {
  account: Account | TokenAccount,
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
  searchResults: (Account | TokenAccount)[],
  accounts: Account[],
): SearchResult[] => {
  const formated = reduce(
    searchResults,
    (acc, account: TokenAccount | Account) => {
      if (account.type === "TokenAccount") {
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
      } else if (account.type === "Account") {
        if (!acc[account.id]) {
          acc[account.id] = {
            account,
            tokenAccounts: [],
          };
        }
        acc[account.id].match = true;
      }
      return acc;
    },
    {},
  );
  return flattenStructuredSearchResults(formated);
};
