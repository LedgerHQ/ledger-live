import type { AccountsState } from "@domain/entity-account";
import { CryptoOrTokenCurrencyIdSchema, type CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Feature, Features, PartialFeatures } from "@shared/feature-flags";
import type { GetReceiveFamilyConfig, ReceiveTarget } from "../types";
import { resolveReceiveFamilyConfig } from "./resolveReceiveFamilyConfig";
import { toReceiveTarget } from "./toReceiveTarget";

type NewReceiveFlowFlag = Feature<NonNullable<Features["newReceiveFlow"]["params"]>>;

export type ResolveReceiveRouteInput<A> = Readonly<{
  flag: NewReceiveFlowFlag | null | undefined;
  accounts: AccountsState;
  /** The legacy id of the main account, its token account's parent for a token. */
  legacyAccountId: string;
  asset: Pick<CryptoOrTokenCurrency, "id" | "type">;
  family: string;
  familyConfig: GetReceiveFamilyConfig<A> | undefined;
  featureFlags: PartialFeatures;
  legacyAccount: A;
}>;

/**
 * Where the new receive flow opens, or `undefined` for the legacy flow: the flag is off, the
 * account model does not hold the account yet, or the family keeps the legacy flow.
 */
export function resolveReceiveRoute<A>({
  flag,
  accounts,
  legacyAccountId,
  asset,
  family,
  familyConfig,
  featureFlags,
  legacyAccount,
}: ResolveReceiveRouteInput<A>): ReceiveTarget | undefined {
  if (!flag?.enabled) return undefined;
  const assetId = CryptoOrTokenCurrencyIdSchema.safeParse(asset.id);
  const target = assetId.success && toReceiveTarget(accounts, legacyAccountId, assetId.data);
  if (!target) return undefined;

  const { isSupported } = resolveReceiveFamilyConfig({
    family,
    familyConfig: familyConfig?.({
      descriptor: target.descriptor,
      asset,
      featureFlags,
      legacyAccount,
    }),
    excludedFamilies: flag.params?.excludedFamilies ?? [],
  });
  return isSupported ? target : undefined;
}
