import {
  AccountStatusSchema,
  AssetStatusSchema,
  type AccountStatus,
  type AssetStatus,
} from "./schema";

/** A used account, ready to transact unless overridden. */
export function mockAccountStatus(overrides: Partial<AccountStatus> = {}): AccountStatus {
  return AccountStatusSchema.parse({ used: true, gate: null, ...overrides });
}

/** An asset the account holds without a gate unless overridden. */
export function mockAssetStatus(overrides: Partial<AssetStatus> = {}): AssetStatus {
  return AssetStatusSchema.parse({ gate: null, ...overrides });
}
