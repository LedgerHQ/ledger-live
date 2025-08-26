import type { ExplorerView, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { HEDERA_TRANSACTION_KINDS } from "./constants";
import type {
  HederaAccount,
  HederaOperationExtra,
  TokenAssociateProperties,
  Transaction,
  TransactionStatus,
} from "./types";

const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
): string | undefined => {
  const extra = isValidExtra(operation.extra) ? operation.extra : null;

  return explorerView?.tx?.replace(
    "$hash",
    extra?.consensusTimestamp ?? extra?.transactionId ?? "0",
  );
};

const isTokenAssociateTransaction = (
  tx: Transaction,
): tx is Extract<Required<Transaction>, { properties: TokenAssociateProperties }> => {
  return tx.properties?.name === HEDERA_TRANSACTION_KINDS.TokenAssociate.name;
};

const isAutoTokenAssociationEnabled = (account: AccountLike) => {
  const hederaAccount = "hederaResources" in account ? (account as HederaAccount) : null;

  return hederaAccount?.hederaResources?.isAutoTokenAssociationEnabled ?? false;
};

const isTokenAssociationRequired = (
  account: AccountLike,
  token: TokenCurrency | null | undefined,
) => {
  const subAccounts = !!account && "subAccounts" in account ? account.subAccounts ?? [] : [];
  const isTokenAssociated = subAccounts.some(item => item.token.id === token?.id);

  return !!token && !isTokenAssociated && !isAutoTokenAssociationEnabled(account);
};

const isValidExtra = (extra: unknown): extra is HederaOperationExtra => {
  return !!extra && typeof extra === "object" && !Array.isArray(extra);
};

// disables the "Continue" button in the Send modal's Recipient step during token transfers if:
// - the recipient is not associated with the token
// - the association status can't be verified
const sendRecipientCanNext = (status: TransactionStatus) => {
  const { missingAssociation, unverifiedAssociation } = status.warnings;

  return !missingAssociation && !unverifiedAssociation;
};

export {
  sendRecipientCanNext,
  getTransactionExplorer,
  isValidExtra,
  isTokenAssociateTransaction,
  isTokenAssociationRequired,
  isAutoTokenAssociationEnabled,
};
