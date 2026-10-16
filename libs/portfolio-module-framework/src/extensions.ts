import { isPortfolioApiError, PortfolioApiError } from "./errors";
import type { PortfolioApi } from "./types";

/** The account reads a portfolio may extend the service with, served by the side holding the account. */
export const ACCOUNT_EXTENSION_METHODS = [
  "getFreshAddress",
  "getChangeAddress",
  "getAccountAddresses",
  "getAccountUtxos",
] as const;

/** The network reads a portfolio may extend the service with. */
export const NETWORK_EXTENSION_METHODS = [
  "getAccountInfo",
  "call",
  "getAddressesForPublicKey",
  "getTransactionInfo",
] as const;

/** The writes a portfolio may extend the service with. */
export const WRITE_EXTENSION_METHODS = ["validateTransaction", "encodeRawTransaction"] as const;

export type AccountExtensionMethod = (typeof ACCOUNT_EXTENSION_METHODS)[number];
export type NetworkExtensionMethod = (typeof NETWORK_EXTENSION_METHODS)[number];
export type WriteExtensionMethod = (typeof WRITE_EXTENSION_METHODS)[number];

/** The optional methods of `PortfolioApi`, which the portfolio-service does not define. */
export type ExtensionMethod =
  | AccountExtensionMethod
  | NetworkExtensionMethod
  | WriteExtensionMethod;

export const EXTENSION_METHODS: readonly ExtensionMethod[] = [
  ...ACCOUNT_EXTENSION_METHODS,
  ...NETWORK_EXTENSION_METHODS,
  ...WRITE_EXTENSION_METHODS,
];

/**
 * The extension `name` of `api`, bound to it; a `METHOD_NOT_ALLOWED` `PortfolioApiError` when
 * `api` does not serve it.
 */
export function requireExtension<K extends ExtensionMethod>(
  api: Partial<Pick<PortfolioApi, K>>,
  name: K,
): NonNullable<PortfolioApi[K]> {
  const method = api[name] as ((...args: never[]) => unknown) | undefined;
  if (!method) throw new PortfolioApiError("METHOD_NOT_ALLOWED", `${name} is not served`);
  return method.bind(api) as NonNullable<PortfolioApi[K]>;
}

/**
 * Whether a portfolio failed because it does not serve what was asked: the one test of
 * "unsupported" (an absent extension, a capability the network lacks). Never a bare 405 status.
 */
export const isUnsupported = (error: unknown): boolean =>
  isPortfolioApiError(error) && error.type === "METHOD_NOT_ALLOWED";
