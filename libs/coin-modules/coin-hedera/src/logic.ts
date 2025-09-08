import type { ExplorerView, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Operation as LiveOperation } from "@ledgerhq/types-live";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_KINDS } from "./constants";
import type {
  HederaAccount,
  HederaOperationExtra,
  TokenAssociateProperties,
  Transaction,
  TransactionStatus,
} from "./types";
import type { HederaMirrorTransaction } from "./network/types";
import { base64ToUrlSafeBase64 } from "./bridge/utils";
import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { parseTransfers } from "./network/utils";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: LiveOperation,
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

const isHederaTransactionType = (type: string): type is HEDERA_OPERATION_TYPES => {
  return [HEDERA_OPERATION_TYPES.CryptoTransfer.toString()].includes(type);
};

/**
 * Maps a Hedera transaction to Ledger Live operations
 *
 * @param tx - The transaction from Mirror node
 * @param address - The account address
 * @returns Array of operations
 */
function mapMirrorTransactionToOperations(
  tx: HederaMirrorTransaction,
  address: string,
): LiveOperation[] {
  const operations: LiveOperation[] = [];

  // Extract common fields
  const timestamp = new Date(parseInt(tx.consensus_timestamp.split(".")[0], 10) * 1000);
  const hash = base64ToUrlSafeBase64(tx.transaction_hash);
  const fee = new BigNumber(tx.charged_tx_fee);
  const hasFailed = tx.result !== "SUCCESS";
  const extraData = {
    consensusTimestamp: tx.consensus_timestamp,
    pagingToken: tx.consensus_timestamp, // for Alpaca pagination
  };

  // Handle token transfers
  if (tx.token_transfers && tx.token_transfers.length > 0) {
    const tokenId = tx.token_transfers[0].token_id;
    const token = findTokenByAddressInCurrency(tokenId, "hedera");

    if (token) {
      const encodedTokenId = encodeTokenAccountId(address, token);
      const { type, value, senders, recipients } = parseTransfers(tx.token_transfers, address);

      // Add FEES operation for outgoing token transfers
      if (type === "OUT") {
        operations.push({
          id: hash,
          accountId: address,
          type: "FEES",
          value: fee,
          recipients,
          senders,
          hash,
          fee,
          date: timestamp,
          blockHeight: 5,
          blockHash: null,
          hasFailed,
          extra: extraData,
        });
      }

      // Add token operation
      operations.push({
        id: encodeOperationId(encodedTokenId, hash, type),
        accountId: encodedTokenId,
        type,
        value,
        recipients,
        senders,
        hash,
        fee,
        date: timestamp,
        blockHeight: 5,
        blockHash: null,
        hasFailed,
        extra: {
          ...extraData,
          assetId: tokenId,
          assetReference: tokenId, // For Alpaca sub-accounts
          assetOwner: address, // For Alpaca sub-accounts
        },
      });
    }
  }
  // Handle HBAR transfers
  else if (tx.transfers && tx.transfers.length > 0) {
    const { type, value, senders, recipients } = parseTransfers(tx.transfers, address);
    const operationType = tx.name === "TOKENASSOCIATE" ? "ASSOCIATE_TOKEN" : type;

    operations.push({
      id: encodeOperationId(address, hash, operationType),
      accountId: address,
      type: operationType,
      value,
      recipients,
      senders,
      hash,
      fee,
      date: timestamp,
      blockHeight: 5,
      blockHash: null,
      hasFailed,
      extra: extraData,
    });
  }

  return operations;
}

export {
  sendRecipientCanNext,
  getTransactionExplorer,
  isValidExtra,
  isTokenAssociateTransaction,
  isTokenAssociationRequired,
  isAutoTokenAssociationEnabled,
  isHederaTransactionType,
  mapMirrorTransactionToOperations,
};
