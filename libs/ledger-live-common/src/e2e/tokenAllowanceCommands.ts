import { parseCurrencyUnit } from "../currencies/index";
import type { GetTokenAllowanceOpts, TokenApprovalOpts } from "./runCli";
import type { TokenAccount } from "./enum/Account";
import { approveToken } from "./families/evm";

export type GetTokenAllowanceParams = GetTokenAllowanceOpts;
export type TokenApprovalCliParams = TokenApprovalOpts;

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
 * Curried command for E2E: returns current allowance as a decimal string if {@link minAmount}
 * is covered, otherwise `0`.
 */
export function createIsTokenAllowanceSufficientCommand(
  getTokenAllowance: (params: GetTokenAllowanceOpts) => Promise<string>,
) {
  return (account: TokenAccount, spenderAddress: string, minAmount: string) => async () => {
    const ownerAddress = account.parentAccount?.address ?? account.address;
    if (!ownerAddress) throw new Error("Token allowance check requires the main account address");

    const output = await getTokenAllowance({
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
}

/**
 * Runs ledger-live CLI token approval with Speculos device confirmation, managing
 * `DISABLE_TRANSACTION_BROADCAST` around the CLI call.
 */
export function createApproveTokenCommand(
  tokenApproval: (params: TokenApprovalOpts) => Promise<unknown>,
) {
  return (account: TokenAccount, spender: string, approveAmount: string) => async () => {
    const original = setDisableTransactionBroadcastEnv("0");

    const result = tokenApproval({
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
