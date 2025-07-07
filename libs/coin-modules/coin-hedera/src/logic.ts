import type { ExplorerView } from "@ledgerhq/types-cryptoassets";
import type { Operation } from "@ledgerhq/types-live";
import type { HederaMirrorTransaction } from "./api/mirror";
import { getCurrentHederaPreloadData } from "./preload-data";
import type {
  HederaAccount,
  HederaOperationExtra,
  HederaValidator,
  Transaction,
  StakingTransactionProperties,
} from "./types";

const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
): string | undefined => {
  const extra = operation.extra as HederaOperationExtra;

  return explorerView?.tx?.replace("$hash", extra.consensusTimestamp ?? extra.transactionId ?? "0");
};

const isStakingTransaction = (
  tx: Transaction,
): tx is Extract<Required<Transaction>, { properties: StakingTransactionProperties }> => {
  return tx.properties?.name === "staking";
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

const getMemo = (tx: HederaMirrorTransaction): string | null => {
  return !!tx.memo_base64 ? Buffer.from(tx.memo_base64, "base64").toString("utf-8") : null;
};

export {
  getTransactionExplorer,
  isStakingTransaction,
  extractCompanyFromNodeDescription,
  getValidatorFromAccount,
  getMemo,
};
