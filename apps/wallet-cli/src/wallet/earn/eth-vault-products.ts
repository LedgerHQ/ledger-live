import type { AccountDescriptor } from "../models";
import type { DefiProduct } from "./api.types";
import type { NormalizedDefiProduct } from "./normalize";

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function productMatchKeys(product: DefiProduct): string[] {
  return [product.id, product.vault_id, product.address, product.vault].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

/**
 * Find the backend product matching a user-supplied id/vault_id/address/vault. Returns the RAW
 * backend product (the caller normalizes it) so the allowlist match still keys off every raw alias.
 */
export function resolveDefiProduct(
  products: readonly DefiProduct[],
  productId: string,
): DefiProduct {
  const needle = normalize(productId);
  const product = products.find(candidate =>
    productMatchKeys(candidate).some(value => normalize(value) === needle),
  );
  if (!product) {
    throw new Error(
      `Unknown EVM earn product "${productId}". Use a product id, vault_id, address, or vault returned by \`earn yields\`.`,
    );
  }
  return product;
}

/** ERC-4626 vault contract address (the deposit/redeem target); throws when the backend omits it. */
export function requireVault(product: NormalizedDefiProduct): string {
  const value = product.vault;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Defi product ${product.id} is missing required field "vault".`);
  }
  return value;
}

/** ERC-20 asset contract pulled into the vault (the approve target); throws when omitted. */
export function requireAsset(product: NormalizedDefiProduct): string {
  const value = product.asset;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Defi product ${product.id} is missing required field "asset".`);
  }
  return value;
}

/** EVM chain id the vault lives on; throws when the backend omits it. */
export function requireChainId(product: NormalizedDefiProduct): number {
  const value = product.chainId;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new TypeError(`Defi product ${product.id} is missing required integer field "chain_id".`);
  }
  return value;
}

/** Asset decimals used to convert a human amount to base units; throws when the backend omits it. */
export function requireAssetDecimals(product: NormalizedDefiProduct): number {
  const value = product.assetDecimals;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new TypeError(
      `Defi product ${product.id} is missing required integer field "asset_decimals".`,
    );
  }
  return value;
}

export function accountAddress(descriptor: AccountDescriptor): string {
  const address = descriptor.freshAddress || descriptor.seedIdentifier;
  if (!address) {
    throw new Error(
      "Could not determine the EVM wallet address from the account descriptor. Re-discover the account before using earn.",
    );
  }
  return address;
}
