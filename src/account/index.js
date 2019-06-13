// @flow
import type {
  AddAccountsSection,
  AddAccountsSectionResult
} from "./addAccounts";
import {
  getMainAccount,
  getAccountCurrency,
  getAccountUnit,
  isAccountEmpty,
  clearAccount,
  flattenAccounts
} from "./helpers";
import {
  shouldShowNewAccount,
  canBeMigrated,
  findAccountMigration,
  groupAddAccounts,
  addAccounts
} from "./addAccounts";
import {
  inferSubOperations,
  toOperationRaw,
  fromOperationRaw,
  toTokenAccountRaw,
  fromTokenAccountRaw,
  toAccountRaw,
  fromAccountRaw
} from "./serialization";
import { encodeAccountId, decodeAccountId, getWalletName } from "./accountId";
import {
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  validateNameEdition
} from "./accountName";
import {
  sortAccounts,
  sortAccountsComparatorFromOrder,
  comparatorSortAccounts,
  flattenSortAccounts,
  nestedSortAccounts,
  reorderAccountByCountervalues,
  reorderTokenAccountsByCountervalues
} from "./ordering";
import {
  groupAccountsOperationsByDay,
  groupAccountOperationsByDay
} from "./groupOperations";

export type { AddAccountsSection, AddAccountsSectionResult };

export {
  getMainAccount,
  getAccountCurrency,
  getAccountUnit,
  isAccountEmpty,
  clearAccount,
  flattenAccounts,
  shouldShowNewAccount,
  canBeMigrated,
  findAccountMigration,
  groupAddAccounts,
  addAccounts,
  inferSubOperations,
  toOperationRaw,
  fromOperationRaw,
  toTokenAccountRaw,
  fromTokenAccountRaw,
  toAccountRaw,
  fromAccountRaw,
  encodeAccountId,
  decodeAccountId,
  getWalletName,
  getAccountPlaceholderName,
  getNewAccountPlaceholderName,
  validateNameEdition,
  sortAccounts,
  sortAccountsComparatorFromOrder,
  comparatorSortAccounts,
  flattenSortAccounts,
  nestedSortAccounts,
  reorderAccountByCountervalues,
  reorderTokenAccountsByCountervalues,
  groupAccountsOperationsByDay,
  groupAccountOperationsByDay
};
