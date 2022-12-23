import reduce from "lodash/reduce";
import forEach from "lodash/forEach";
import type { Account, AccountLike, SubAccount } from "@ledgerhq/types-live";

export type SearchResult = {
  account: AccountLike & { disabled?: boolean };
  parentAccount?: Account;
  tokenAccounts?: (AccountLike & { match: boolean })[];
  match?: boolean;
};

const flattenStructuredSearchResults = (
  structuredResults: Record<string, SearchResult>,
): SearchResult[] =>
  reduce<Record<string, SearchResult>, SearchResult[]>(
    structuredResults,
    (acc, searchResult) => {
      acc.push(searchResult);
      forEach(searchResult.tokenAccounts, tokenAccount => {
        acc.push({ account: tokenAccount, match: tokenAccount.match });
      });
      return acc;
    },
    [],
  );

export const formatSearchResults = (
  searchResults: AccountLike[],
  accounts: Account[],
) => {
  const formated = reduce<AccountLike, { [key: string]: SearchResult }>(
    searchResults,
    (acc, account) => {
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
            account: parentAccount as AccountLike,
            tokenAccounts: [],
            match: false,
          };
        }

        acc[parentId].tokenAccounts = [
          ...acc[parentId].tokenAccounts!,
          {
            ...account,
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
    (acc: Record<string, SearchResult>, tuple) => {
      const accountId = tuple.subAccount
        ? tuple.subAccount.id
        : tuple.account.id;

      if (!acc[accountId]) {
        acc[accountId] = {
          account: tuple.subAccount || tuple.account,
          parentAccount: tuple.subAccount
            ? (tuple.account as Account)
            : undefined,
          tokenAccounts: [],
        };
      }

      acc[accountId].match = true;
      return acc;
    },
    {} as Record<string, SearchResult>,
  );
  return flattenStructuredSearchResults(formated);
};
