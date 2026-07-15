import fs from "fs";
import invariant from "invariant";
import type { DerivationMode } from "@ledgerhq/types-live";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { getSeedIdentifierDerivation } from "@ledgerhq/ledger-wallet-framework/derivation";
import { Account, TokenAccount } from "./enum/Account";
import { Currency } from "./enum/Currency";
import { Transaction } from "./models/Transaction";
import {
  runCliGetAddress,
  runCliGetTokenAllowance,
  runCliLiveData,
  runCliTokenApproval,
  isRetryableError,
} from "./runCli";
import type { TokenApprovalOpts } from "./runCli";
import { sleep } from "./index";
import { runWithCrossProcessLock } from "./crossProcessLock";
import { getCcdAccountAddress } from "./families/concordium";
import { approveToken } from "./families/evm";
import { getCryptoCurrencyById, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  applyGeneratedUserdata,
  getGeneratedAddress,
  hasGeneratedUserdata,
} from "./generatedUserdata";
import { getCachedAddress, isUtxoBasedCurrency } from "./addressCache";
import { getCachedUtxoAddress } from "./utxoAddressCache";

export type LiveDataCommandOptions = {
  readonly useScheme?: boolean;
  readonly currency?: string;
};

export const getAccountAddress = async (account: Account | TokenAccount): Promise<string> => {
  if (account.currency.id === Currency.HBAR.id) {
    invariant(account.address, "hedera: account address must be pre-set");
    return account.address;
  }

  if (account.currency.id === Currency.CCD_TESTNET.id) {
    const address = await getCcdAccountAddress(account);
    account.address = address;
    return address;
  }

  if (!isUtxoBasedCurrency(account.currency.id)) {
    const cached = getCachedAddress(account) ?? getGeneratedAddress(account);
    if (cached) {
      account.address = cached;
      return cached;
    }
  } else {
    const cached = getCachedUtxoAddress(account);
    if (cached) {
      account.address = cached;
      return cached;
    }
  }

  const { address } = await runCliGetAddress({
    currency: account.currency.speculosApp.name,
    path: account.accountPath,
    derivationMode: account.derivationMode,
  });

  account.address = address;
  return address;
};

export const liveDataCommand = (
  account: Account | TokenAccount,
  options?: LiveDataCommandOptions,
) => {
  const cmd = async (userdataPath?: string) => {
    if (applyGeneratedUserdata(account, userdataPath)) return;
    await runCliLiveData({
      currency: options?.currency ?? account.currency.speculosApp.name,
      index: account.index,
      ...(options?.useScheme && account.derivationMode ? { scheme: account.derivationMode } : {}),
      add: true,
      appjson: userdataPath,
    });
  };
  cmd.canUseGeneratedUserdata = () => hasGeneratedUserdata(account);
  return cmd;
};

/**
 * Family-specific fields that must exist on an empty `AccountRaw` so the
 * desktop app's rehydration / portfolio code doesn't crash on undefined.
 */
function emptyFamilyExtras(family: string): Record<string, unknown> {
  switch (family) {
    case "tron":
      return {
        tronResources: {
          frozen: {},
          delegatedFrozen: {},
          unFrozen: { bandwidth: [], energy: [] },
          legacyFrozen: {},
          votes: [],
          tronPower: 0,
          energy: "0",
          bandwidth: { freeUsed: "0", freeLimit: "0", gainedUsed: "0", gainedLimit: "0" },
          unwithdrawnReward: "0",
          cacheTransactionInfoById: {},
        },
      };
    default:
      return {};
  }
}

/**
 * Append an unactivated/empty account directly to userdata's `app.json`.
 *
 * Use this instead of {@link liveDataCommand} for empty-balance test accounts
 * at indices beyond the first empty one. The standard `liveData --index N`
 * relies on `bridge.scanAccounts`, whose gap-limit (`mandatoryEmptyAccountSkip`)
 * stops scanning after the first unused account, so an empty TRX_3 (index 2)
 * is never emitted when TRX_2 is also empty.
 *
 * This helper:
 *  1. Derives the receive address via Speculos at `account.accountPath`.
 *  2. Derives the device's `seedIdentifier` via Speculos at the currency's
 *     seed-identifier path.
 *  3. Writes a minimal `AccountRaw` stub into `data.accounts` of `app.json`.
 *
 * The stub is idempotent (no-op if an account with the same id already exists).
 */
export const addEmptyAccountCommand =
  (account: Account, options?: LiveDataCommandOptions) => async (userdataPath?: string) => {
    if (!userdataPath) {
      throw new Error("addEmptyAccountCommand requires a userdataPath");
    }

    const speculosCurrency = options?.currency ?? account.currency.speculosApp.name;
    const derivationMode = account.derivationMode ?? "";
    const cryptoCurrency = getCryptoCurrencyById(account.currency.id);

    // seedIdentifier = pubkey returned by getAddress at the currency-specific seed-id path
    // (matches `seedIdentifier = result.publicKey` in makeScanAccounts).
    const seedIdPath = getSeedIdentifierDerivation(
      cryptoCurrency,
      derivationMode as DerivationMode,
    );
    const { publicKey: seedIdentifier } = await runCliGetAddress({
      currency: speculosCurrency,
      path: seedIdPath,
      derivationMode,
    });

    const { address } = await runCliGetAddress({
      currency: speculosCurrency,
      path: account.accountPath,
      derivationMode,
    });

    const id = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: account.currency.id,
      xpubOrAddress: address,
      derivationMode: derivationMode as DerivationMode,
    });

    const stub: Record<string, unknown> = {
      id,
      seedIdentifier,
      name: account.accountName,
      starred: false,
      used: false,
      derivationMode,
      index: account.index,
      freshAddress: address,
      freshAddressPath: account.accountPath,
      blockHeight: 0,
      creationDate: new Date().toISOString(),
      operationsCount: 0,
      operations: [],
      pendingOperations: [],
      currencyId: account.currency.id,
      balance: "0",
      spendableBalance: "0",
      swapHistory: [],
    };

    // Family-specific extras required by serialization / portfolio rendering
    // on an unactivated account. Without these the desktop app crashes during
    // rehydration (e.g. Tron: `tronResources.bandwidth.freeLimit`).
    Object.assign(stub, emptyFamilyExtras(cryptoCurrency.family));

    const raw = JSON.parse(fs.readFileSync(userdataPath, "utf-8"));
    raw.data = raw.data ?? {};
    if (typeof raw.data.accounts === "string") {
      throw new Error("encrypted ledger live data is not supported");
    }
    raw.data.accounts = raw.data.accounts ?? [];
    const exists = raw.data.accounts.some(
      (entry: { data?: { id?: string } }) => entry?.data?.id === id,
    );
    if (!exists) {
      raw.data.accounts.push({ data: stub, version: 1 });
      fs.writeFileSync(userdataPath, JSON.stringify(raw), "utf-8");
    }
  };

export const liveDataWithAddressCommand = (
  account: Account | TokenAccount,
  options?: LiveDataCommandOptions,
) => {
  const cmd = async (userdataPath?: string) => {
    await liveDataCommand(account, options)(userdataPath);

    const address = await getAccountAddress(account);

    account.address = address;
    if ("parentAccount" in account && account.parentAccount) {
      account.parentAccount.address = address;
    }

    return address;
  };
  cmd.canUseGeneratedUserdata = () =>
    hasGeneratedUserdata(account) && !isUtxoBasedCurrency(account.currency.id);
  return cmd;
};

export const liveDataWithParentAddressCommand = (
  liveDataAccount: Account | TokenAccount,
  accountToAssign: TokenAccount,
) => {
  const cmd = async (userdataPath?: string) => {
    if (!applyGeneratedUserdata(liveDataAccount, userdataPath)) {
      await runCliLiveData({
        currency: liveDataAccount.currency.speculosApp.name,
        index: liveDataAccount.index,
        add: true,
        appjson: userdataPath,
      });
    }

    if (!accountToAssign.parentAccount) {
      throw new Error("Parent account is required");
    }

    const address = await getAccountAddress(accountToAssign.parentAccount);

    accountToAssign.address = address;
    return address;
  };
  cmd.canUseGeneratedUserdata = () =>
    hasGeneratedUserdata(liveDataAccount) &&
    !!accountToAssign.parentAccount &&
    hasGeneratedUserdata(accountToAssign.parentAccount) &&
    !isUtxoBasedCurrency(accountToAssign.parentAccount.currency.id);
  return cmd;
};

export const liveDataWithRecipientAddressCommand = (
  tx: Transaction,
  options?: LiveDataCommandOptions,
) => {
  return async (userdataPath?: string) => {
    if (!applyGeneratedUserdata(tx.accountToDebit, userdataPath)) {
      await runCliLiveData({
        currency: tx.accountToDebit.currency.speculosApp.name,
        index: tx.accountToDebit.index,
        ...(options?.useScheme && tx.accountToDebit.derivationMode
          ? { scheme: tx.accountToDebit.derivationMode }
          : {}),
        add: true,
        appjson: userdataPath,
      });
    }

    const address = await getAccountAddress(tx.accountToCredit);

    tx.accountToCredit.address = address;
    tx.recipientAddress = address;

    return address;
  };
};

export function parseTokenAllowanceCliOutput(output: string): {
  allowanceStr: string;
  unitMagnitude: number;
} {
  const jsonStart = output.indexOf("{");
  if (jsonStart === -1) throw new Error("No JSON found in tokenAllowance output:\n" + output);

  const rawParsed: unknown = JSON.parse(output.slice(jsonStart));
  if (typeof rawParsed !== "object" || rawParsed === null) {
    throw new Error("Invalid tokenAllowance JSON:\n" + output);
  }

  const allowanceField = Reflect.get(rawParsed, "allowance");
  if (typeof allowanceField !== "string") {
    throw new Error("Invalid tokenAllowance JSON (allowance):\n" + output);
  }
  const allowanceStr = allowanceField.trim();
  if (!/^\d+$/.test(allowanceStr)) {
    throw new Error("Invalid raw allowance in tokenAllowance:\n" + output);
  }

  const magnitudeField = Reflect.get(rawParsed, "unitMagnitude");
  if (
    typeof magnitudeField !== "number" ||
    !Number.isInteger(magnitudeField) ||
    magnitudeField < 0
  ) {
    throw new Error(
      "tokenAllowance JSON missing or invalid unitMagnitude (update CLI / ledger-live):\n" + output,
    );
  }

  return { allowanceStr, unitMagnitude: magnitudeField };
}

/**
 * Returns current allowance as a decimal string if {@link minAmount}
 * is covered, otherwise `0`.
 */
export const isTokenAllowanceSufficientCommand = async (
  account: TokenAccount,
  spenderAddress: string,
  minAmount: string,
) => {
  const ownerAddress = account.parentAccount?.address ?? account.address;
  if (!ownerAddress) throw new Error("Token allowance check requires the main account address");

  const output = await runCliGetTokenAllowance({
    currency: account.currency.speculosApp.name,
    token: account.currency.id,
    spenderAddress,
    index: account.index,
    format: "json",
    ownerAddress,
  });

  const { allowanceStr, unitMagnitude } = parseTokenAllowanceCliOutput(output);

  const smallestUnit = { name: "smallest", code: "", magnitude: unitMagnitude } as const;
  const minInSmallestUnit = parseCurrencyUnit(smallestUnit, minAmount);
  const minStr = minInSmallestUnit.toFixed(0);

  const allowanceBi = BigInt(allowanceStr);
  const minBi = BigInt(minStr);
  if (allowanceBi >= minBi) return allowanceStr;
  return 0;
};

/**
 * Returns the raw on-chain ERC-20 allowance as a decimal string in smallest
 * units. Use when an exact-value assertion is needed (e.g. assert allowance
 * is exactly zero after a revoke). Use {@link isTokenAllowanceSufficientCommand}
 * when only a threshold check is needed.
 */
export async function getTokenAllowanceCommand(
  account: TokenAccount,
  spenderAddress: string,
): Promise<string> {
  const ownerAddress = account.parentAccount?.address ?? account.address;
  if (!ownerAddress) throw new Error("Token allowance check requires the main account address");

  const output = await runCliGetTokenAllowance({
    currency: account.currency.speculosApp.name,
    token: account.currency.id,
    spenderAddress,
    index: account.index,
    format: "json",
    ownerAddress,
  });

  const { allowanceStr } = parseTokenAllowanceCliOutput(output);
  return allowanceStr;
}

const MAX_BROADCAST_ATTEMPTS = 3;
const BROADCAST_RETRY_DELAY_MS = 5_000;

/**
 * Broadcasts one token approve/revoke and retries transient nonce/broadcast
 * failures (underpriced, nonce too low, not confirmed). The CLI runs with
 * `retries: 1` because each re-broadcast re-presents the device prompt, which we
 * must drive again via {@link approveToken} — so the retry lives here, not inside
 * the CLI helper. `DISABLE_TRANSACTION_BROADCAST` is forced to "0" per attempt.
 */
async function runTokenApprovalWithRetry(opts: TokenApprovalOpts): Promise<string> {
  for (let attempt = 1; attempt <= MAX_BROADCAST_ATTEMPTS; attempt++) {
    const original = setDisableTransactionBroadcastEnv("0");
    const result = runCliTokenApproval(opts, 1);
    // The CLI child has already spawned and inherited the env, so restore it now:
    // holding the flag set across the awaits below could leak it into unrelated
    // work in the same worker process. The finally is kept as a safety net.
    setDisableTransactionBroadcastEnv(original);
    const cliSettled = result.catch(() => undefined);

    try {
      await approveToken();
      return await result;
    } catch (err) {
      // Retry only once the previous CLI has actually exited. Its child has no
      // timeout/kill (see runCliCommand), so cap the wait; if it's still running
      // we must NOT spawn a second CLI on the same device — bail instead of looping.
      const cliDidSettle = await Promise.race([
        cliSettled.then(() => true),
        sleep(BROADCAST_RETRY_DELAY_MS).then(() => false),
      ]);
      const message = err instanceof Error ? err.message : String(err);
      if (!cliDidSettle) {
        console.warn(
          `⚠️ Token ${opts.mode}: previous CLI still running after ${BROADCAST_RETRY_DELAY_MS}ms – aborting retry`,
          message,
        );
        throw err;
      }
      if (attempt === MAX_BROADCAST_ATTEMPTS || !isRetryableError(message)) throw err;

      console.warn(
        `⚠️ Token ${opts.mode} attempt ${attempt}/${MAX_BROADCAST_ATTEMPTS} failed with retryable error – retrying in ${BROADCAST_RETRY_DELAY_MS}ms…`,
        message,
      );
      await sleep(BROADCAST_RETRY_DELAY_MS);
    } finally {
      setDisableTransactionBroadcastEnv(original);
    }
  }
  throw new Error(`Token ${opts.mode} broadcast failed after ${MAX_BROADCAST_ATTEMPTS} attempts`);
}

/**
 * Serializes the broadcast under a cross-worker lock on the parent EOA so two
 * Playwright workers never grab the same nonce (QAA-1323).
 */
async function broadcastTokenApproval(
  account: TokenAccount,
  opts: TokenApprovalOpts,
): Promise<string> {
  const owner = account.parentAccount ?? account;
  const eoa = (owner.address ?? (await getAccountAddress(owner))).toLowerCase();
  const lockKey = `${owner.currency.id}:${eoa}`;
  // Prevent nonce races across workers (QAA-1323).
  return runWithCrossProcessLock(lockKey, () => runTokenApprovalWithRetry(opts));
}

export function approveTokenCommand(account: TokenAccount, spender: string, approveAmount: string) {
  return broadcastTokenApproval(account, {
    currency: account.currency.speculosApp.name,
    index: account.index,
    spender,
    token: account.currency.id,
    mode: "approve",
    approveAmount,
    waitConfirmation: true,
  });
}

export function revokeTokenCommand(account: TokenAccount, spender: string) {
  return broadcastTokenApproval(account, {
    currency: account.currency.speculosApp.name,
    index: account.index,
    spender,
    token: account.currency.id,
    mode: "revokeApproval",
    waitConfirmation: true,
  });
}

const ENV_KEY = "DISABLE_TRANSACTION_BROADCAST";

export function setDisableTransactionBroadcastEnv(value: string | undefined): string | undefined {
  const previous = process.env[ENV_KEY];
  if (value === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = value;
  }
  return previous;
}
