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
  flattenAccounts,
  addPendingOperation,
  shortAddressPreview
} from "./helpers";
import {
  shouldShowNewAccount,
  canBeMigrated,
  findAccountMigration,
  groupAddAccounts,
  addAccounts,
  migrateAccounts
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
  sortAccountsComparatorFromOrder,
  comparatorSortAccounts,
  flattenSortAccounts,
  nestedSortAccounts
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
  migrateAccounts,
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
  sortAccountsComparatorFromOrder,
  comparatorSortAccounts,
  flattenSortAccounts,
  nestedSortAccounts,
  groupAccountsOperationsByDay,
  groupAccountOperationsByDay,
  addPendingOperation,
  shortAddressPreview
};
