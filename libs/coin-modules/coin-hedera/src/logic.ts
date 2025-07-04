import { ExplorerView } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import {
  HederaAccount,
  HederaOperationExtra,
  HederaValidator,
  Transaction,
  UpdateAccountProperties,
} from "./types";
import { getCurrentHederaPreloadData } from "./preload-data";

const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
): string | undefined => {
  const extra = operation.extra as HederaOperationExtra;

  return explorerView?.tx?.replace("$hash", extra.consensusTimestamp ?? extra.transactionId ?? "0");
};

const isUpdateAccountTransaction = (
  tx: Transaction,
): tx is Extract<Required<Transaction>, { properties: UpdateAccountProperties }> => {
  return tx.properties?.name === "updateAccount";
};

const extractCompanyFromNodeDescription = (description: string): string => {
  return description
    .split("|")[0]
    .replace(/hosted by/i, "")
    .replace(/hosted for/i, "")
    .trim();
};

const getValidatorFromAccount = (account: HederaAccount): HederaValidator | null => {
  const { delegation } = account.hederaResources || {};

  if (!delegation) {
    return null;
  }

  const validators = getCurrentHederaPreloadData(account.currency);
  const validator = validators.validators.find(v => v.nodeId === delegation.nodeId);

  return validator ?? null;
};

export {
  getTransactionExplorer,
  isUpdateAccountTransaction,
  extractCompanyFromNodeDescription,
  getValidatorFromAccount,
};
