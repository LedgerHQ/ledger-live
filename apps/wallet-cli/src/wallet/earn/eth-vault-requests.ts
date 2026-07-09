import type { AccountDescriptor } from "../models";
import { accountAddress, requireAsset, requireChainId, requireVault } from "./eth-vault-products";
import { EVM_VAULT_IGNORE_CHECKS } from "./eth-vault-policy";
import type { NormalizedDefiProduct } from "./normalize";

export function buildDepositRequest(params: {
  descriptor: AccountDescriptor;
  product: NormalizedDefiProduct;
  amount: string;
}) {
  const { descriptor, product, amount } = params;
  return {
    wallet: accountAddress(descriptor),
    asset: requireAsset(product),
    chain_id: requireChainId(product),
    vault: requireVault(product),
    amount,
    ignore_checks: EVM_VAULT_IGNORE_CHECKS,
  };
}

// NOTE(unit): for a PARTIAL withdraw, `amount` is in ASSET base units (converted with the vault's
// `asset_decimals`), matching how the deposit leg is built — confirmed against the Kiln DeFi API
// (`/v1/defi/withdraw` expects `amount * 10**asset_decimals`). For a FULL exit, pass the sentinel
// string `"max"`: the backend crafts a `redeem(shares_balance)` that leaves no dust. Kiln explicitly
// warns against computing the asset amount yourself for a full exit, since the share→asset rate
// drifts between build and inclusion.
export function buildWithdrawRequest(params: {
  descriptor: AccountDescriptor;
  product: NormalizedDefiProduct;
  amount: string;
}) {
  const { descriptor, product, amount } = params;
  return {
    wallet: accountAddress(descriptor),
    chain_id: requireChainId(product),
    vault: requireVault(product),
    amount,
    ignore_checks: EVM_VAULT_IGNORE_CHECKS,
  };
}
