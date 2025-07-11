import { getEnv } from "@ledgerhq/live-env";
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
  HederaOperationType,
  HederaDelegationStatus,
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

const sortValidators = (validators: HederaValidator[]): HederaValidator[] => {
  const ledgerNodeId = getEnv("HEDERA_STAKING_LEDGER_NODE_ID");

  // sort validators by nodeId in ASC order, with Ledger node first if it exists
  return validators.sort((a, b) => {
    if (typeof ledgerNodeId === "number") {
      if (a.nodeId === ledgerNodeId) return -1;
      if (b.nodeId === ledgerNodeId) return 1;
    }

    return a.nodeId - b.nodeId;
  });
};

const getValidatorFromAccount = (account: HederaAccount): HederaValidator | null => {
  const { delegation } = account.hederaResources ?? {};

  if (!delegation) {
    return null;
  }

  const validators = getCurrentHederaPreloadData(account.currency);
  const validator = validators.validators.find(v => v.nodeId === delegation.nodeId) ?? null;

  return validator;
};

const getHederaOperationType = (tx: Transaction): HederaOperationType => {
  if (isStakingTransaction(tx)) {
    return "CryptoUpdate";
  }

  return "CryptoTransfer";
};

const getMemo = (tx: HederaMirrorTransaction): string | null => {
  return tx.memo_base64 ? Buffer.from(tx.memo_base64, "base64").toString("utf-8") : null;
};

const getDefaultValidator = (validators: HederaValidator[]): HederaValidator | null => {
  if (validators.length === 0) return null;
  const ledgerNodeId = getEnv("HEDERA_STAKING_LEDGER_NODE_ID");
  const ledgerValidator = validators.find(v => v.nodeId === ledgerNodeId);

  if (ledgerValidator) {
    return ledgerValidator;
  }

  return validators.reduce((highest, current) =>
    current.activeStake.gt(highest.activeStake) ? current : highest,
  );
};

const getDelegationStatus = (validator: HederaValidator | null): HederaDelegationStatus => {
  if (!validator) {
    return "inactive";
  }

  if (validator.overstaked) {
    return "overstaked";
  }

  return "active";
};

export {
  getTransactionExplorer,
  isStakingTransaction,
  extractCompanyFromNodeDescription,
  sortValidators,
  getValidatorFromAccount,
  getDefaultValidator,
  getHederaOperationType,
  getDelegationStatus,
  getMemo,
};
