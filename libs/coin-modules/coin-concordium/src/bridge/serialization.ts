import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, AccountRaw, Operation, OperationType } from "@ledgerhq/types-live";
import type {
  ConcordiumAccount,
  ConcordiumAccountRaw,
  ConcordiumResources,
  ConcordiumResourcesRaw,
  RawOperation,
} from "../types";

export function isConcordiumAccount(account: Account): account is ConcordiumAccount {
  return account.currency?.family === "concordium" && "concordiumResources" in account;
}

function isConcordiumAccountRaw(accountRaw: AccountRaw): accountRaw is ConcordiumAccountRaw {
  return "concordiumResources" in accountRaw;
}

/** Fails to compile when a resources field is declared but not mapped below. */
function assertNoUnmappedFields(_rest: Record<string, never>): void {}

/**
 * Naming the fields keeps what reaches disk an allowlist. `tokens` is copied by
 * reference, as Canton does with its own keyed map: nothing mutates an entry in
 * place, so a deep copy would protect nothing.
 */
function toResourcesRaw(r: ConcordiumResources): ConcordiumResourcesRaw {
  const { isOnboarded, credId, publicKey, identityIndex, credNumber, ipIdentity, tokens, ...rest } =
    r;
  assertNoUnmappedFields(rest);
  return {
    isOnboarded,
    credId,
    publicKey,
    identityIndex,
    credNumber,
    ipIdentity,
    ...(tokens === undefined ? {} : { tokens }),
  };
}

function fromResourcesRaw(r: ConcordiumResourcesRaw): ConcordiumResources {
  const { isOnboarded, credId, publicKey, identityIndex, credNumber, ipIdentity, tokens, ...rest } =
    r;
  assertNoUnmappedFields(rest);
  return {
    isOnboarded,
    credId,
    publicKey,
    identityIndex,
    credNumber,
    ipIdentity,
    ...(tokens === undefined ? {} : { tokens }),
  };
}

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  if (!isConcordiumAccount(account) || !account.concordiumResources) {
    return;
  }

  (accountRaw as ConcordiumAccountRaw).concordiumResources = toResourcesRaw(
    account.concordiumResources,
  );
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  if (!isConcordiumAccountRaw(accountRaw) || !accountRaw.concordiumResources) {
    return;
  }

  (account as ConcordiumAccount).concordiumResources = fromResourcesRaw(
    accountRaw.concordiumResources,
  );
}

export function mapRawOperationToBridgeOperation(op: RawOperation, accountId: string): Operation {
  const type: OperationType = op.type;

  const extra: Record<string, unknown> = op.memo ? { memo: op.memo } : {};

  return {
    id: encodeOperationId(accountId, op.hash, type),
    hash: op.hash,
    accountId,
    type,
    value: new BigNumber(op.value),
    fee: new BigNumber(op.fee),
    blockHash: op.blockHash,
    blockHeight: op.blockHeight,
    senders: [op.sender],
    recipients: [op.recipient],
    date: op.date,
    extra,
  };
}
