import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Transaction as HederaSDKTransaction } from "@hashgraph/sdk";
import { AssetInfo, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets/fiats";
import cvsApi from "@ledgerhq/live-countervalues/api/index";
import { makeLRUCache, seconds } from "@ledgerhq/live-network/cache";
import type { Currency, ExplorerView, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike, Operation as LiveOperation } from "@ledgerhq/types-live";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import { hederaMirrorNode } from "../network/mirror";
import type {
  HederaAccount,
  HederaOperationExtra,
  Transaction,
  TransactionStatus,
  TransactionTokenAssociate,
} from "../types";

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

export const getMemoFromBase64 = (memoBase64: string): string | null => {
  try {
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
  async (accountId: string, tokenId: string) => {
    const mirrorAccount = await hederaMirrorNode.getAccount(accountId);

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
