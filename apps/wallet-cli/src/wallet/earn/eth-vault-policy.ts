import type { ApplicationDependency } from "@ledgerhq/device-management-kit";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountDescriptor } from "../models";
import { requireChainId } from "./eth-vault-products";
import type { NormalizedDefiProduct, NormalizedDefiTransaction } from "./normalize";

export const EVM_VAULT_GAS_LIMIT_MULTIPLIER = 1.3;
export const EVM_VAULT_IGNORE_CHECKS = true;
export const EVM_VAULT_KILN_DEPENDENCIES: ApplicationDependency[] = [{ name: "Kiln" }];
export const EVM_VAULT_TX_STATUS_POLL_ATTEMPTS = 30;
export const EVM_VAULT_TX_STATUS_POLL_INTERVAL_MS = 5_000;

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Vault statuses that mean "not currently depositable" (paused / wound down / not yet live). A
 * product with no `status` is kept, so only explicit unavailable statuses are excluded.
 */
const NON_DEPOSITABLE_VAULT_STATUSES = new Set([
  "disabled",
  "paused",
  "closed",
  "inactive",
  "deprecated",
]);

/** Whether a vault's backend lifecycle `status` permits new deposits. */
export function isVaultDepositable(product: { status?: string }): boolean {
  const status = normalize(product.status);
  return status === "" || !NON_DEPOSITABLE_VAULT_STATUSES.has(status);
}

/**
 * Refuse to deposit into a vault the backend has marked non-depositable. `earn yields` already hides
 * these, but a user can still pass such a vault id straight to `earn deposit --product`; since the
 * /v1/defi/* calls run with `ignore_checks: true`, the CLI is the only pre-device gate.
 */
export function assertVaultDepositable(product: { id: string; status?: string }): void {
  if (!isVaultDepositable(product)) {
    throw new Error(
      `Refusing to deposit: vault ${product.id} is not currently depositable (status: ${
        product.status ?? "unknown"
      }).`,
    );
  }
}

export function assertAccountMatchesProductChain(
  descriptor: AccountDescriptor,
  product: NormalizedDefiProduct,
): void {
  const expectedChainId = requireChainId(product);
  const accountChainId = getCryptoCurrencyById(descriptor.currencyId).ethereumLikeInfo?.chainId;
  if (accountChainId === undefined) {
    throw new Error(
      `Account currency "${descriptor.currencyId}" is not an EVM chain; earn vault ${product.id} requires chain id ${expectedChainId}.`,
    );
  }
  if (accountChainId !== expectedChainId) {
    throw new Error(
      `Refusing to sign: account "${descriptor.id}" is on chain id ${accountChainId} but vault ${product.id} is on chain id ${expectedChainId}. Use an account on the vault's chain.`,
    );
  }
}

export function assertTransactionWallet(
  tx: Pick<NormalizedDefiTransaction, "wallet">,
  expectedWallet: string,
  step: string,
): void {
  if (normalize(tx.wallet) !== normalize(expectedWallet)) {
    throw new Error(
      `Refusing to sign ${step}: backend transaction wallet ${tx.wallet} does not match the signing account address ${expectedWallet}.`,
    );
  }
}

export function assertTransactionTarget(
  tx: Pick<NormalizedDefiTransaction, "to">,
  expectedTo: string,
  step: string,
): void {
  if (normalize(tx.to) !== normalize(expectedTo)) {
    throw new Error(
      `Refusing to sign ${step}: backend transaction target ${tx.to} does not match allowlisted target ${expectedTo}.`,
    );
  }
}

function isZeroNativeValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "0x" || trimmed === "0X") return true;
  try {
    return BigInt(trimmed) === 0n;
  } catch {
    return false;
  }
}

export function assertZeroNativeValue(
  tx: Pick<NormalizedDefiTransaction, "value">,
  step: string,
): void {
  if (!isZeroNativeValue(tx.value)) {
    throw new Error(
      `Refusing to sign ${step}: backend transaction carries non-zero native value ${tx.value}.`,
    );
  }
}

export function assertTransactionChainId(
  tx: Pick<NormalizedDefiTransaction, "chainId">,
  expectedChainId: number,
  step: string,
): void {
  if (tx.chainId !== expectedChainId) {
    throw new Error(
      `Refusing to sign ${step}: backend transaction chain id ${tx.chainId} does not match expected chain id ${expectedChainId}.`,
    );
  }
}

export function assertEvmVaultTransactionSafety(
  tx: Pick<NormalizedDefiTransaction, "wallet" | "to" | "value" | "chainId">,
  expectedWallet: string,
  expectedTo: string,
  expectedChainId: number,
  step: string,
): void {
  // The backend output is treated as untrusted (ignore_checks: true), so bind every field that ties
  // the signed calldata to the intended signer: the wallet it was built for, the target, the native
  // value, and the chain id.
  assertTransactionWallet(tx, expectedWallet, step);
  assertTransactionTarget(tx, expectedTo, step);
  assertZeroNativeValue(tx, step);
  assertTransactionChainId(tx, expectedChainId, step);
}
