import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, AccountRaw, Operation, OperationType } from "@ledgerhq/types-live";
import type {
  ConcordiumAccount,
  ConcordiumAccountRaw,
  ConcordiumResources,
  RawOperation,
} from "../types";
import coinConfig from "../config";
import { applyTokensToResources } from "./tokens";

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

/**
 * Reads the token flag, treating an unreadable config as off.
 *
 * `getCoinConfig` throws when unset, but that does not mean "too early":
 * `fromAccountRaw` awaits `getAccountBridgeByFamily`, which loads the family
 * setup, and concordium's setup seeds the config at module initialization. A
 * throw therefore signals abnormal config resolution, where failing closed is
 * right — exposing token UI for a feature that is off by default is worse than
 * rebuilding sub-accounts from chain on the next sync.
 */
function tokensEnabled(currencyId: string): boolean {
  try {
    return coinConfig.getCoinConfig(currencyId).enableTokens === true;
  } catch {
    return false;
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  if (!isConcordiumAccountRaw(accountRaw) || !accountRaw.concordiumResources) {
    return;
  }

  const resources = copyResources(accountRaw.concordiumResources);

  // The only account-producing path no `postSync` covers: the framework assigns
  // the raw token sub-accounts just before calling this hook, so without a strip
  // here disabling the flag would hold only until the next app start.
  if (!tokensEnabled(account.currency.id)) {
    (account as ConcordiumAccount).concordiumResources = applyTokensToResources(resources, {
      kind: "cleared",
    });
    delete account.subAccounts;
    return;
  }

  (account as ConcordiumAccount).concordiumResources = resources;
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
