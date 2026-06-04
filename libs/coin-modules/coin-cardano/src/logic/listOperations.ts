import {
  AssetInfo,
  Page,
  MemoNotSupported,
  Operation,
  ListOperationsOptions,
} from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { OperationType } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import network from "@ledgerhq/live-network/network";
import { BigNumber } from "bignumber.js";
import { APITransaction, HashType, StakeDelegationCertificate } from "../api/api-types";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import {
  isTestnet,
  getMemoFromTx,
  isHexString,
  decodeTokenName,
  getBech32PoolId,
  findStakeRegistration,
  findStakeDeRegistration,
  findWithdrawal,
  getOperationType,
} from "../logic";
import { getNetworkParameters } from "../networks";
import {
  safeBigInt,
  safeDate,
  normalizeAddress,
  extractPaymentKeyFromAddress,
  extractStakeKeyFromAddress,
  EMPTY_CREDENTIAL_KEY,
} from "../utils";

// Logs a warning when a page yields an unusually large number of operations. One
// transaction can produce several operations (native + one per token moved), so
// the threshold is measured in derived operations, not transactions.
const LARGE_OPERATION_SET_THRESHOLD = 200;

type TransactionParties = {
  senders: string[];
  recipients: string[];
};

type TokenBalance = {
  policyId: string;
  assetName: string;
  balance: bigint;
};

function buildTransactionInfo(
  tx: APITransaction,
  senders: string[],
): Operation<MemoNotSupported>["tx"] {
  return {
    hash: tx.hash,
    block: {
      height: tx.blockHeight,
      hash: "", // Cardano API doesn't provide block hash in transaction list
      time: safeDate(tx.timestamp),
    },
    fees: safeBigInt(tx.fees),
    feesPayer: senders.length === 1 ? senders[0] : undefined,
    date: safeDate(tx.timestamp),
    failed: false, // Cardano API only returns successful transactions
  };
}

function extractParties(tx: APITransaction): TransactionParties {
  const senderSet = new Set<string>();

  if (Array.isArray(tx.inputs)) {
    for (const input of tx.inputs) {
      const address = normalizeAddress(input.address, isHexString);
      senderSet.add(address);
    }
  }

  const recipientSet = new Set<string>();

  if (Array.isArray(tx.outputs)) {
    for (const output of tx.outputs) {
      const address = normalizeAddress(output.address, isHexString);
      recipientSet.add(address);
    }
  }

  const senders = Array.from(senderSet);
  const recipients = Array.from(recipientSet);

  return {
    senders,
    recipients,
  };
}

// Returns SIGNED value (positive = received, negative = spent)
function computeValue(tx: APITransaction, paymentKey: string): bigint {
  let totalReceived = 0n;
  let totalSpent = 0n;

  if (Array.isArray(tx.outputs)) {
    for (const output of tx.outputs) {
      if (output.paymentKey === paymentKey) {
        totalReceived += safeBigInt(output.value);
      }
    }
  }

  if (Array.isArray(tx.inputs)) {
    for (const input of tx.inputs) {
      if (input.paymentKey === paymentKey) {
        totalSpent += safeBigInt(input.value);
      }
    }
  }

  return totalReceived - totalSpent;
}

// Finds a delegation certificate belonging to THIS account's stake key.
// A transaction may carry certificates for several accounts, so matching on the
// stake key is required before attributing the delegation (and its pool) to us.
function findOwnedStakeDelegation(
  tx: APITransaction,
  stakeKey: string,
): StakeDelegationCertificate | undefined {
  return tx.certificate.stakeDelegations?.find(
    cert => cert.stakeCredential.type === HashType.ADDRESS && cert.stakeCredential.key === stakeKey,
  );
}

// Staking types (DELEGATE/UNDELEGATE) are only assigned when the certificate
// belongs to this account's stake key. Certificates for other accounts present
// in the same transaction must not reclassify our operation.
function determineOperationType(
  tx: APITransaction,
  stakeKey: string | undefined,
  networkId: number,
  stakeKeyDeposit: string,
  operationValue: bigint,
  fees: bigint,
): OperationType {
  if (stakeKey) {
    if (findOwnedStakeDelegation(tx, stakeKey)) {
      return "DELEGATE";
    }

    if (findStakeDeRegistration(tx, stakeKey, networkId, stakeKeyDeposit) !== undefined) {
      return "UNDELEGATE";
    }
  }

  return getOperationType({
    valueChange: new BigNumber(operationValue.toString()),
    fees: new BigNumber(fees.toString()),
  });
}

function toNativeOperation(
  currency: CryptoCurrency,
  paymentKey: string,
  tx: APITransaction,
  parties: TransactionParties,
  stakeKey: string | undefined,
  stakeKeyDeposit: string,
): Operation<MemoNotSupported> {
  const { senders, recipients } = parties;
  const networkParams = getNetworkParameters(currency.id);

  const details: Record<string, unknown> = {};

  const memo = getMemoFromTx(tx);
  if (memo) {
    details.memo = memo;
  }

  let operationValue = computeValue(tx, paymentKey);

  if (stakeKey) {
    const registration = findStakeRegistration(
      tx,
      stakeKey,
      networkParams.networkId,
      stakeKeyDeposit,
    );
    if (registration) {
      details.deposit = registration;
    }

    const deRegistration = findStakeDeRegistration(
      tx,
      stakeKey,
      networkParams.networkId,
      stakeKeyDeposit,
    );
    if (deRegistration) {
      const refundAmount = safeBigInt(deRegistration);
      operationValue = operationValue - refundAmount;
      details.refund = deRegistration;
    }

    const withdrawal = findWithdrawal(tx, stakeKey);
    if (withdrawal) {
      const withdrawalAmount = safeBigInt(withdrawal);
      operationValue = operationValue - withdrawalAmount;
      details.rewards = withdrawal;
    }
  }

  const ownedDelegation = stakeKey ? findOwnedStakeDelegation(tx, stakeKey) : undefined;
  if (ownedDelegation) {
    details.poolId = getBech32PoolId(ownedDelegation.poolKeyHash, currency.id);
  }

  if (tx.metadata?.hash) {
    details.metadataHash = tx.metadata.hash;
  }

  const fees = safeBigInt(tx.fees);
  const type = determineOperationType(
    tx,
    stakeKey,
    networkParams.networkId,
    stakeKeyDeposit,
    operationValue,
    fees,
  );

  // The generic-coin-framework adapter re-adds tx.fees to native OUT/FEES/DELEGATE/
  // UNDELEGATE operations (libs/ledger-live-common/src/bridge/generic-coin-framework/utils.ts),
  // so Operation.value must EXCLUDE the fee for those types to avoid double-counting.
  // IN/NONE are passed through as-is by the adapter. A pure-fee self-transfer (FEES)
  // therefore carries value 0 — the adapter surfaces the fee.
  const magnitude = operationValue >= 0n ? operationValue : -operationValue;
  const adapterReaddsFee =
    type === "OUT" || type === "FEES" || type === "DELEGATE" || type === "UNDELEGATE";
  const value = adapterReaddsFee ? (magnitude > fees ? magnitude - fees : 0n) : magnitude;

  const assetInfo: AssetInfo = { type: "native" };

  return {
    id: `${currency.id}-${tx.hash}`,
    type,
    senders,
    recipients,
    value,
    asset: assetInfo,
    tx: buildTransactionInfo(tx, senders),
    details,
  };
}

// Process token items with balance multiplier (-1n for inputs, +1n for outputs)
function processTokenItems(
  items: Array<{
    paymentKey: string;
    tokens: Array<{ policyId: string; assetName: string; value: string }>;
  }>,
  paymentKey: string,
  balanceMultiplier: bigint,
  tokenBalances: Map<string, TokenBalance>,
): void {
  for (const item of items) {
    if (item.paymentKey !== paymentKey) {
      continue;
    }

    for (const token of item.tokens) {
      const key = `${token.policyId}.${token.assetName}`;
      const current = tokenBalances.get(key) || {
        policyId: token.policyId,
        assetName: token.assetName,
        balance: 0n,
      };
      current.balance += safeBigInt(token.value) * balanceMultiplier;
      tokenBalances.set(key, current);
    }
  }
}

function extractTokenOperations(
  currency: CryptoCurrency,
  address: string,
  paymentKey: string,
  tx: APITransaction,
  parties: TransactionParties,
): Operation<MemoNotSupported>[] {
  const tokenOperations: Operation<MemoNotSupported>[] = [];
  const { senders, recipients } = parties;

  const tokenBalances = new Map<string, TokenBalance>();

  if (Array.isArray(tx.inputs)) {
    processTokenItems(tx.inputs, paymentKey, -1n, tokenBalances);
  }

  if (Array.isArray(tx.outputs)) {
    processTokenItems(tx.outputs, paymentKey, 1n, tokenBalances);
  }

  for (const [, tokenData] of tokenBalances) {
    // Zero net balance is normal (self-transfers / consolidations) — skip silently
    // rather than logging on every such token, which would be noisy in production.
    if (tokenData.balance === 0n) {
      continue;
    }

    const isReceiving = tokenData.balance > 0n;
    const tokenType = isReceiving ? "IN" : "OUT";
    const tokenValue = tokenData.balance >= 0n ? tokenData.balance : -tokenData.balance;

    // Canonical Cardano asset id: policyId (56 hex) concatenated with the asset name, no
    // separator — matches getTokenAssetId (buildSubAccounts) and getBalance, so a reference from
    // any producer is interchangeable (e.g. feeding a listed token into craftTransaction).
    const assetReference = `${tokenData.policyId}${tokenData.assetName}`;

    const assetInfo: AssetInfo = {
      type: "token",
      assetReference,
      assetOwner: address,
    };

    const decodedName = decodeTokenName(tokenData.assetName);
    const details: Record<string, unknown> = {
      policyId: tokenData.policyId,
      assetName: tokenData.assetName,
    };

    if (decodedName !== tokenData.assetName) {
      details.assetNameDecoded = decodedName;
    }

    tokenOperations.push({
      id: `${currency.id}-${tx.hash}-${assetReference}`,
      type: tokenType,
      senders,
      recipients,
      value: tokenValue,
      asset: assetInfo,
      tx: buildTransactionInfo(tx, senders),
      details,
    });
  }

  return tokenOperations;
}

// We don't send a limit to this endpoint; the server dictates the page size and
// returns it as `limit`, which the caller uses only to detect a full page.
async function fetchTransactionsByPaymentKey(
  paymentKey: string,
  currency: CryptoCurrency,
  blockHeight: number = 0,
  pageNo: number = 1,
): Promise<{
  transactions: APITransaction[];
  pageNo: number;
  limit: number;
  blockHeight: number;
}> {
  const endpoint = isTestnet(currency) ? CARDANO_TESTNET_API_ENDPOINT : CARDANO_API_ENDPOINT;

  const res = await network({
    method: "POST",
    url: `${endpoint}/v1/transaction`,
    data: {
      paymentKeys: [paymentKey],
      pageNo,
      blockHeight,
    },
  });

  const {
    transactions = [],
    pageNo: resPageNo = pageNo,
    limit = 0,
    blockHeight: resBlockHeight = blockHeight,
  } = res.data;

  return {
    transactions,
    pageNo: resPageNo,
    limit,
    blockHeight: resBlockHeight,
  };
}

/**
 * List operations for a Cardano address with pagination support.
 *
 * Pagination is page-based. This implementation never sends a `limit` to the
 * `/v1/transaction` endpoint, so `options.limit` has no effect — the page size
 * is whatever the server returns (used only to detect a full page). The
 * `options.minHeight` and `options.order` options are applied.
 *
 * @param currency - The Cardano currency object
 * @param address - Cardano address string (bech32 format)
 * @param options - Pagination and filtering options (note: `limit` is not sent and has no effect)
 * @returns Paginated list of operations (native ADA + tokens)
 */
export async function listOperations(
  currency: CryptoCurrency,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation<MemoNotSupported>>> {
  // The backend pages newest -> oldest and the cursor only moves forward, so
  // ascending order can't be honored consistently across pages. Reject it rather
  // than return a misleading within-page-only sort (same stance as coin-solana).
  if (options.order === "asc") {
    throw new Error("ascending order is not supported");
  }

  if (!address || typeof address !== "string") {
    return {
      items: [],
      next: undefined,
    };
  }

  const paymentKey = extractPaymentKeyFromAddress(address);

  if (paymentKey === EMPTY_CREDENTIAL_KEY) {
    return {
      items: [],
      next: undefined,
    };
  }

  const stakeKey = extractStakeKeyFromAddress(address);

  let pageNo = 1;
  if (options.cursor) {
    const parsed = Number.parseInt(options.cursor, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      log("cardano/listOperations", "Invalid cursor, falling back to page 1", {
        cursor: options.cursor,
        parsed,
        address,
      });
    } else {
      pageNo = parsed;
    }
  }
  const blockHeight = options.minHeight || 0;

  // Use the page number the backend actually served (it may clamp/normalize the
  // requested one) so the `next` cursor stays consistent with the server.
  const {
    transactions,
    limit,
    pageNo: servedPageNo,
  } = await fetchTransactionsByPaymentKey(paymentKey, currency, blockHeight, pageNo);

  // Pre-Conway registration/de-registration amounts aren't carried on the
  // certificate — they come from the protocol params (as the rest of the Cardano
  // stack does). Fetch once, and only when the page actually contains such a
  // certificate, to avoid an extra request for plain transfer history.
  const hasPreConwayStakeCerts = transactions.some(
    tx => tx.certificate.stakeRegistrations?.length || tx.certificate.stakeDeRegistrations?.length,
  );
  const stakeKeyDeposit = hasPreConwayStakeCerts
    ? (await fetchNetworkInfo(currency)).protocolParams.stakeKeyDeposit
    : "";

  const allOperations: Operation<MemoNotSupported>[] = [];

  for (const tx of transactions) {
    if (options.minHeight && tx.blockHeight < options.minHeight) {
      continue;
    }

    const parties = extractParties(tx);

    const nativeOp = toNativeOperation(
      currency,
      paymentKey,
      tx,
      parties,
      stakeKey,
      stakeKeyDeposit,
    );
    allOperations.push(nativeOp);

    const tokenOps = extractTokenOperations(currency, address, paymentKey, tx, parties);
    allOperations.push(...tokenOps);
  }

  if (allOperations.length > LARGE_OPERATION_SET_THRESHOLD) {
    log("cardano/listOperations", "Large operation set returned", {
      operationCount: allOperations.length,
      transactionCount: transactions.length,
      pageNo: servedPageNo,
      addressTruncated: `${address.substring(0, 20)}...`,
    });
  }

  // Descending (newest first) — ascending is rejected above.
  allOperations.sort((a, b) => b.tx.date.getTime() - a.tx.date.getTime());

  // Page fullness is decided on the raw transaction count, not the derived
  // operation count: a full page filtered out by minHeight still has more pages.
  const hasMore = limit > 0 && transactions.length >= limit;
  const nextCursor = hasMore ? String(servedPageNo + 1) : undefined;

  return {
    items: allOperations,
    next: nextCursor,
  };
}
