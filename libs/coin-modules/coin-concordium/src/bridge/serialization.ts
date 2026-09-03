import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, AccountRaw, Operation, OperationType } from "@ledgerhq/types-live";
import type {
  ConcordiumAccount,
  ConcordiumAccountRaw,
  ConcordiumResources,
  RawOperation,
} from "../types";

export function isConcordiumAccount(account: Account): account is ConcordiumAccount {
  return account.currency?.family === "concordium" && "concordiumResources" in account;
}

function isConcordiumAccountRaw(accountRaw: AccountRaw): accountRaw is ConcordiumAccountRaw {
  return "concordiumResources" in accountRaw;
}

/**
 * Serves both directions: the runtime and raw shapes are identical, so a
 * separate converter per direction would be the same function twice. Split it
 * the day a field needs converting.
 *
 * Naming the fields makes this an allowlist: a key on the input that is not
 * listed here is dropped rather than carried to disk. The `satisfies` line is
 * compile-time only — it turns a field added to the type but forgotten here
 * into an error instead of data silently lost on save.
 *
 * `tokens` is copied by reference, as Canton does with its own keyed map:
 * nothing mutates an entry in place, so a deep copy would protect nothing.
 */
function copyResources(r: ConcordiumResources): ConcordiumResources {
  const { isOnboarded, credId, publicKey, identityIndex, credNumber, ipIdentity, tokens, ...rest } =
    r;
  void (rest satisfies Record<string, never>);
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

  (accountRaw as ConcordiumAccountRaw).concordiumResources = copyResources(
    account.concordiumResources,
  );
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  if (!isConcordiumAccountRaw(accountRaw) || !accountRaw.concordiumResources) {
    return;
  }

  (account as ConcordiumAccount).concordiumResources = copyResources(
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
