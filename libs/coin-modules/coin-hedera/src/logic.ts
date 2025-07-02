import { ExplorerView } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";

import { HederaAccount, HederaOperationExtra, Transaction, UpdateAccountProperties } from "./types";

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

const extractCompanyFromNodeDescription = (description: string) => {
  return description
    .split("|")[0]
    .replace(/hosted by/i, "")
    .trim();
};

export { getTransactionExplorer, isUpdateAccountTransaction, extractCompanyFromNodeDescription };
