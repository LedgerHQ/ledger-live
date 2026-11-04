import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { isNotEnoughBalance } from "../../../exchange/isNotEnoughBalance";

const GENERIC_SIGN_ERROR_NAMES = new Set(["PayloadStepError", "AddressesSanctionedError"]);

export function isDepositGenericSignError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { name, title } = error as Record<"name" | "title", unknown>;

  return [name, title].some(
    value => typeof value === "string" && GENERIC_SIGN_ERROR_NAMES.has(value),
  );
}

export function shouldReturnToDepositForm(error: unknown): boolean {
  return isNotEnoughBalance(error) || isDepositGenericSignError(error);
}

export type DepositSignErrorStep = Readonly<{ kind: "error"; error: Error; isGeneric: boolean }>;

export function toDepositSignErrorStep(
  error: unknown,
  {
    depositAccount,
    receiverAccount,
    track,
  }: Readonly<{
    depositAccount: AccountLike;
    receiverAccount: AccountLike;
    track: (event: string, properties: Record<string, string>) => void;
  }>,
): DepositSignErrorStep {
  const isGeneric = isDepositGenericSignError(error);
  if (isGeneric) {
    track("swap error message", {
      message: "deposit_sign_failed",
      page: "perps_deposit_sign",
      flow: "perps",
      sourceCurrency: getAccountCurrency(depositAccount).ticker,
      targetCurrency: getAccountCurrency(receiverAccount).ticker,
    });
  }
  return {
    kind: "error",
    error: error instanceof Error ? error : new Error(String(error)),
    isGeneric,
  };
}
