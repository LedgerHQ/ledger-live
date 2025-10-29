import BigNumber from "bignumber.js";
import { createHash } from "crypto";
import invariant from "invariant";
import { AccountId, Transaction as HederaSDKTransaction } from "@hashgraph/sdk";
import { AssetInfo, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/fiats";
import cvsApi from "@ledgerhq/live-countervalues/api/index";
import { InvalidAddress } from "@ledgerhq/errors";
import { makeLRUCache, seconds } from "@ledgerhq/live-network/cache";
import type { Currency, ExplorerView, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Operation as LiveOperation } from "@ledgerhq/types-live";
import {
  HEDERA_OPERATION_TYPES,
  HEDERA_TRANSACTION_MODES,
  SYNTHETIC_BLOCK_WINDOW_SECONDS,
} from "../constants";
import { apiClient } from "../network/api";
import type {
  HederaAccount,
  HederaOperationExtra,
  Transaction,
  TransactionStatus,
  TransactionTokenAssociate,
} from "../types";
import { rpcClient } from "../network/rpc";
import { HederaRecipientInvalidChecksum } from "../errors";

export const serializeSignature = (signature: Uint8Array) => {
  return Buffer.from(signature).toString("base64");
};

export const deserializeSignature = (signature: string) => {
  return Buffer.from(signature, "base64");
};

export const serializeTransaction = (tx: HederaSDKTransaction) => {
  return Buffer.from(tx.toBytes()).toString("hex");
};

export const deserializeTransaction = (tx: string) => {
  return HederaSDKTransaction.fromBytes(Buffer.from(tx, "hex"));
};

export const getOperationValue = ({
  asset,
  operation,
}: {
  asset: AssetInfo;
  operation: LiveOperation<HederaOperationExtra>;
}) => {
  if (operation.type === "FEES") {
    return BigInt(0);
  }

  if (asset.type === "native" && operation.type === "OUT") {
    return BigInt(operation.value.toFixed(0)) - BigInt(operation.fee.toFixed(0));
  }

  return BigInt(operation.value.toFixed(0));
};

// this utils extracts the bodyBytes from a Hedera Transaction that are required for signing
// hardcoded `.get(0)` is here because we are always using single node account id
// this is because we want to avoid "signing" loop for users, as described here:
// https://github.com/LedgerHQ/ledger-live/pull/72/commits/1e942687d4301660e43e0c4b5419fcfa2733b290
export const getHederaTransactionBodyBytes = (tx: HederaSDKTransaction) => {
  const bodyBytes = tx._signedTransactions.get(0)?.bodyBytes;
  invariant(bodyBytes, "hedera: tx body bytes are missing");
  return bodyBytes;
};

export const mapIntentToSDKOperation = (txIntent: TransactionIntent) => {
  if (txIntent.type === HEDERA_TRANSACTION_MODES.TokenAssociate) {
    return HEDERA_OPERATION_TYPES.TokenAssociate;
  }

  if (txIntent.type === HEDERA_TRANSACTION_MODES.Send && txIntent.asset.type !== "native") {
    return HEDERA_OPERATION_TYPES.TokenTransfer;
  }

  return HEDERA_OPERATION_TYPES.CryptoTransfer;
};

export const getMemoFromBase64 = (memoBase64: string | undefined): string | null => {
  try {
    if (memoBase64 === undefined) return null;

    return Buffer.from(memoBase64, "base64").toString("utf-8");
  } catch {
    return null;
  }
};

// NOTE: convert from the non-url-safe version of base64 to the url-safe version (that the explorer uses)
export function base64ToUrlSafeBase64(data: string): string {
  // Might be nice to use this alternative if .nvmrc changes to >= Node v14.18.0
  // base64url encoding option isn't supported until then
  // Buffer.from(data, "base64").toString("base64url");

  return data.replace(/\//g, "_").replace(/\+/g, "-");
}

export const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: LiveOperation,
): string | undefined => {
  const extra = isValidExtra(operation.extra) ? operation.extra : null;

  return explorerView?.tx?.replace(
    "$hash",
    extra?.consensusTimestamp ?? extra?.transactionId ?? "0",
  );
};

export const isTokenAssociateTransaction = (tx: Transaction): tx is TransactionTokenAssociate => {
  return tx.mode === HEDERA_TRANSACTION_MODES.TokenAssociate;
};

export const isAutoTokenAssociationEnabled = (account: AccountLike) => {
  const hederaAccount = "hederaResources" in account ? (account as HederaAccount) : null;

  return hederaAccount?.hederaResources?.isAutoTokenAssociationEnabled ?? false;
};

export const isTokenAssociationRequired = (
  account: AccountLike,
  token: TokenCurrency | null | undefined,
) => {
  const subAccounts = !!account && "subAccounts" in account ? account.subAccounts ?? [] : [];
  const isTokenAssociated = subAccounts.some(item => item.token.id === token?.id);

  return !!token && !isTokenAssociated && !isAutoTokenAssociationEnabled(account);
};

export const isValidExtra = (extra: unknown): extra is HederaOperationExtra => {
  return !!extra && typeof extra === "object" && !Array.isArray(extra);
};

// disables the "Continue" button in the Send modal's Recipient step during token transfers if:
// - the recipient is not associated with the token
// - the association status can't be verified
export const sendRecipientCanNext = (status: TransactionStatus) => {
  const { missingAssociation, unverifiedAssociation } = status.warnings;

  return !missingAssociation && !unverifiedAssociation;
};

// note: this is currently called frequently by getTransactionStatus; LRU cache prevents duplicated requests
export const getCurrencyToUSDRate = makeLRUCache(
  async (currency: Currency) => {
    try {
      const [rate] = await cvsApi.fetchLatest([
        {
          from: currency,
          to: getFiatCurrencyByTicker("USD"),
          startDate: new Date(),
        },
      ]);

      invariant(rate, "no value returned from cvs api");

      return new BigNumber(rate);
    } catch {
      return null;
    }
  },
  currency => currency.ticker,
  seconds(3),
);

export const checkAccountTokenAssociationStatus = makeLRUCache(
  async (address: string, tokenId: string) => {
    const [parsingError, parsingResult] = safeParseAccountId(address);

    if (parsingError) {
      throw parsingError;
    }

    const addressWithoutChecksum = parsingResult.accountId;
    const mirrorAccount = await apiClient.getAccount(addressWithoutChecksum);

    // auto association is enabled
    if (mirrorAccount.max_automatic_token_associations === -1) {
      return true;
    }

    const isTokenAssociated = mirrorAccount.balance.tokens.some(token => {
      return token.token_id === tokenId;
    });

    return isTokenAssociated;
  },
  (accountId, tokenId) => `${accountId}-${tokenId}`,
  seconds(30),
);

export const safeParseAccountId = (
  address: string,
): [Error, null] | [null, { accountId: string; checksum: string | null }] => {
  const currency = findCryptoCurrencyById("hedera");
  const currencyName = currency?.name ?? "Hedera";

  try {
    const accountId = AccountId.fromString(address);

    // verify checksum if present
    // FIXME: migrate to EntityIdHelper methods once SDK is upgraded:
    // https://github.com/hiero-ledger/hiero-sdk-js/blob/main/src/EntityIdHelper.js#L197
    // https://github.com/hiero-ledger/hiero-sdk-js/blob/main/src/EntityIdHelper.js#L446
    const checksum: string | null = address.split("-")[1] ?? null;
    if (checksum) {
      const client = rpcClient.getInstance();
      const recipientWithChecksum = accountId.toStringWithChecksum(client);
      const expectedChecksum = recipientWithChecksum.split("-")[1];

      if (checksum !== expectedChecksum) {
        return [new HederaRecipientInvalidChecksum(), null];
      }
    }

    const result = {
      accountId: accountId.toString(),
      checksum,
    };

    return [null, result];
  } catch (err) {
    return [new InvalidAddress("", { currencyName }), null];
  }
};

/**
 * Calculates a synthetic block height based on Hedera consensus timestamp.
 *
 * @param consensusTimestamp - Hedera consensus timestamp
 * @param blockWindowSeconds - Duration of one synthetic block in seconds (default: 10)
 * @returns Deterministic synthetic block (height and hash)
 */
export function getSyntheticBlock(
  consensusTimestamp: string,
  blockWindowSeconds = SYNTHETIC_BLOCK_WINDOW_SECONDS,
) {
  const seconds = Math.floor(Number(consensusTimestamp));

  if (Number.isNaN(seconds) || seconds === 0) {
    throw new Error(`Invalid consensus timestamp: ${consensusTimestamp}`);
  }

  const blockHeight = Math.floor(seconds / blockWindowSeconds);
  const blockHash = createHash("sha256").update(blockHeight.toString()).digest("hex");
  const blockTime = new Date(seconds * 1000);

  return { blockHeight, blockHash, blockTime };
}
