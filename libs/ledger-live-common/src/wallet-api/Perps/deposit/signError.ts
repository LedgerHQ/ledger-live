import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { isNotEnoughBalance } from "../../../exchange/isNotEnoughBalance";
import { PayloadStepError } from "../../Exchange/SwapError";

const GENERIC_SIGN_ERROR_NAMES = new Set([
  new PayloadStepError().name,
  new AddressesSanctionedError().name,
]);

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
