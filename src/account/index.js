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
import { groupAddAccounts, addAccounts, migrateAccounts } from "./addAccounts";
import {
  shouldShowNewAccount,
  canBeMigrated,
  findAccountMigration,
  checkAccountSupported
} from "./support";
import {
  importAccountsMakeItems,
  importAccountsReduce,
  type ImportItem,
  type ImportItemMode
} from "./importAccounts";
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

export type {
  AddAccountsSection,
  AddAccountsSectionResult,
  ImportItem,
  ImportItemMode
};

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
  shortAddressPreview,
  importAccountsMakeItems,
  importAccountsReduce,
  checkAccountSupported
};
