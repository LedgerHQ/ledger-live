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
} from "./runCli";
import { getCcdAccountAddress } from "./families/concordium";
import { approveToken } from "./families/evm";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../currencies/index";

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

  const { address } = await runCliGetAddress({
    currency: account.currency.speculosApp.name,
    path: account.accountPath,
    derivationMode: account.derivationMode,
  });

  account.address = address;
  return address;
};

export const liveDataCommand =
  (account: Account | TokenAccount, options?: LiveDataCommandOptions) =>
  async (userdataPath?: string) => {
    await runCliLiveData({
      currency: options?.currency ?? account.currency.speculosApp.name,
      index: account.index,
      ...(options?.useScheme && account.derivationMode ? { scheme: account.derivationMode } : {}),
      add: true,
      appjson: userdataPath,
    });
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

export const liveDataWithAddressCommand =
  (account: Account | TokenAccount, options?: LiveDataCommandOptions) =>
  async (userdataPath?: string) => {
    await liveDataCommand(account, options)(userdataPath);

    const address = await getAccountAddress(account);

    account.address = address;
    if ("parentAccount" in account && account.parentAccount) {
      account.parentAccount.address = address;
    }

    return address;
  };

export const liveDataWithParentAddressCommand =
  (liveDataAccount: Account | TokenAccount, accountToAssign: TokenAccount) =>
  async (userdataPath?: string) => {
    await runCliLiveData({
      currency: liveDataAccount.currency.speculosApp.name,
      index: liveDataAccount.index,
      add: true,
      appjson: userdataPath,
    });

    if (!accountToAssign.parentAccount) {
      throw new Error("Parent account is required");
    }

    const address = await getAccountAddress(accountToAssign.parentAccount);

    accountToAssign.address = address;
    return address;
  };

export const liveDataWithRecipientAddressCommand = (
  tx: Transaction,
  options?: LiveDataCommandOptions,
) => {
  return async (userdataPath?: string) => {
    await runCliLiveData({
      currency: tx.accountToDebit.currency.speculosApp.name,
      index: tx.accountToDebit.index,
      ...(options?.useScheme && tx.accountToDebit.derivationMode
        ? { scheme: tx.accountToDebit.derivationMode }
        : {}),
      add: true,
      appjson: userdataPath,
    });

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
export const getTokenAllowanceCommand = async (
  account: TokenAccount,
  spenderAddress: string,
): Promise<string> => {
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
};

/**
 * Runs ledger-live CLI token approval with Speculos device confirmation, managing
 * `DISABLE_TRANSACTION_BROADCAST` around the CLI call.
 */
export const approveTokenCommand = async (
  account: TokenAccount,
  spender: string,
  approveAmount: string,
) => {
  const original = setDisableTransactionBroadcastEnv("0");

  const result = runCliTokenApproval({
    currency: account.currency.speculosApp.name,
    index: account.index,
    spender,
    token: account.currency.id,
    mode: "approve",
    approveAmount,
    waitConfirmation: true,
  });

  try {
    await approveToken();
  } finally {
    setDisableTransactionBroadcastEnv(original);
  }
  return await result;
};

export const revokeTokenCommand = async (account: TokenAccount, spender: string) => {
  const original = setDisableTransactionBroadcastEnv("0");

  const result = runCliTokenApproval({
    currency: account.currency.speculosApp.name,
    index: account.index,
    spender,
    token: account.currency.id,
    mode: "revokeApproval",
    waitConfirmation: true,
  });

  try {
    await approveToken();
  } finally {
    setDisableTransactionBroadcastEnv(original);
  }
  return await result;
};

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
