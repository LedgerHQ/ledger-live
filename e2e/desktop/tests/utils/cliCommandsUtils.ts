import invariant from "invariant";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { CLI } from "tests/utils/cliUtils";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { approveToken } from "@ledgerhq/live-common/e2e/families/evm";

type LiveDataCommandOptions = {
  readonly useScheme?: boolean;
};

export const getAccountAddress = async (account: Account | TokenAccount): Promise<string> => {
  if (account.currency.id === Currency.HBAR.id) {
    invariant(account.address, "hedera: account address must be pre-set");
    return account.address;
  }

  const { address } = await CLI.getAddress({
    currency: account.currency.speculosApp.name,
    path: account.accountPath,
    derivationMode: account.derivationMode,
  });

  return address;
};

export const liveDataCommand =
  (account: Account | TokenAccount, options?: LiveDataCommandOptions) =>
  async (appjsonPath: string) => {
    await CLI.liveData({
      currency: account.currency.speculosApp.name,
      index: account.index,
      ...(options?.useScheme && account.derivationMode ? { scheme: account.derivationMode } : {}),
      add: true,
      appjson: appjsonPath,
    });
  };

export const liveDataWithAddressCommand =
  (account: Account | TokenAccount, options?: LiveDataCommandOptions) =>
  async (appjsonPath: string) => {
    await liveDataCommand(account, options)(appjsonPath);

    const address = await getAccountAddress(account);

    account.address = address;
    if ("parentAccount" in account && account.parentAccount) {
      account.parentAccount.address = address;
    }

    return address;
  };

export const liveDataWithParentAddressCommand =
  (liveDataAccount: Account | TokenAccount, accountToAssign: TokenAccount) =>
  async (appjsonPath: string) => {
    await CLI.liveData({
      currency: liveDataAccount.currency.speculosApp.name,
      index: liveDataAccount.index,
      add: true,
      appjson: appjsonPath,
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
  return async (appjsonPath: string) => {
    await CLI.liveData({
      currency: tx.accountToDebit.currency.speculosApp.name,
      index: tx.accountToDebit.index,
      ...(options?.useScheme && tx.accountToDebit.derivationMode
        ? { scheme: tx.accountToDebit.derivationMode }
        : {}),
      add: true,
      appjson: appjsonPath,
    });

    const address = await getAccountAddress(tx.accountToCredit);

    tx.accountToCredit.address = address;
    tx.recipientAddress = address;

    return address;
  };
};
export const approveTokenCommand =
  (account: TokenAccount, spender: string, approveAmount: string) => async () => {
    const originalDisableBroadcast = setDisableBroadcast("0");

    const result = CLI.tokenApproval({
      currency: account.currency.speculosApp.name,
      index: account.index,
      spender: spender,
      token: account.currency.id,
      mode: "approve",
      approveAmount,
      waitConfirmation: true,
    });

    try {
      await approveToken();
    } finally {
      restoreDisableBroadcast(originalDisableBroadcast);
    }
    return await result;
  };

export const isTokenAllowanceSufficientCommand =
  (account: TokenAccount, spenderAddress: string, minAmount: string) => async () => {
    const ownerAddress = account.parentAccount?.address ?? account.address;
    if (!ownerAddress) throw new Error("Token allowance check requires the main account address");

    const output = await CLI.getTokenAllowance({
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

function parseTokenAllowanceCliOutput(output: string): {
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

function setDisableBroadcast(value: string) {
  const originalDisableTransactionBroadcast = process.env.DISABLE_TRANSACTION_BROADCAST;
  process.env.DISABLE_TRANSACTION_BROADCAST = value;
  return originalDisableTransactionBroadcast;
}

function restoreDisableBroadcast(originalDisableTransactionBroadcast: string | undefined) {
  if (originalDisableTransactionBroadcast === undefined) {
    delete process.env.DISABLE_TRANSACTION_BROADCAST;
  } else {
    process.env.DISABLE_TRANSACTION_BROADCAST = originalDisableTransactionBroadcast;
  }
}
