import { useMemo } from "react";
import type { Features } from "@shared/feature-flags";
import { useFeature, type WalletPlatform } from "@features/platform-feature-flags";

export const DEFAULT_ELIGIBLE_ADDRESS_FAMILIES = ["evm"] as const;

export type ContactsFeaturePlatform = WalletPlatform;

export const CONTACTS_FEATURE_FLAG_KEYS = {
  desktop: "lwdContacts",
  mobile: "lwmContacts",
} as const satisfies Record<ContactsFeaturePlatform, "lwdContacts" | "lwmContacts">;

export type ContactsFeatureConfig = Readonly<{
  isEnabled: boolean;
  showNewBadge: boolean;
  eligibleAddressFamilies: readonly string[];
  excludedCurrencyIds: readonly string[];
}>;

export type ContactsFeatureValue = Features["lwdContacts"] | Features["lwmContacts"];

export type ContactsFeatureParams = Readonly<{
  newBadge: boolean;
  eligibleAddressFamilies: string[];
  excludedCurrencyIds: string[];
}>;

export type ContactsFeatureValuePatch = Readonly<{
  enabled?: boolean;
  params?: Partial<ContactsFeatureParams>;
}>;

export function isContactsEnabledForCurrency(
  config: ContactsFeatureConfig,
  currencyId: string,
): boolean {
  return config.isEnabled && !config.excludedCurrencyIds.includes(currencyId);
}

export function resolveContactsFeatureConfig(
  feature: ContactsFeatureValue | null | undefined,
): ContactsFeatureConfig {
  const isEnabled = feature?.enabled === true;
  const params = resolveContactsFeatureParams(feature?.params);

  return {
    isEnabled,
    showNewBadge: isEnabled && params.newBadge,
    eligibleAddressFamilies: params.eligibleAddressFamilies,
    excludedCurrencyIds: params.excludedCurrencyIds,
  };
}

export function resolveContactsFeatureParams(params: unknown): ContactsFeatureParams {
  const input = toContactsFeatureParamsInput(params);

  return {
    newBadge: input?.newBadge === true,
    eligibleAddressFamilies: normalizeEligibleAddressFamilies(input?.eligibleAddressFamilies),
    excludedCurrencyIds: normalizeExcludedCurrencyIds(input?.excludedCurrencyIds),
  };
}

export function parseEligibleAddressFamiliesInput(value: string): string[] {
  return normalizeEligibleAddressFamilies(value.split(","));
}

export function updateContactsFeatureValue(
  current: ContactsFeatureValue | null | undefined,
  patch: ContactsFeatureValuePatch,
): ContactsFeatureValue {
  const currentParams = isRecord(current?.params) ? current.params : undefined;
  const params = resolveContactsFeatureParams(currentParams);
  const patchParams = patch.params;

  return {
    ...current,
    enabled: patch.enabled ?? current?.enabled === true,
    params: {
      ...currentParams,
      newBadge: patchParams?.newBadge ?? params.newBadge,
      eligibleAddressFamilies:
        patchParams?.eligibleAddressFamilies === undefined
          ? params.eligibleAddressFamilies
          : normalizeEligibleAddressFamilies(patchParams.eligibleAddressFamilies),
      excludedCurrencyIds:
        patchParams?.excludedCurrencyIds === undefined
          ? params.excludedCurrencyIds
          : normalizeExcludedCurrencyIds(patchParams.excludedCurrencyIds),
    },
  };
}

export function useContactsFeature(platform: ContactsFeaturePlatform): ContactsFeatureConfig {
  const feature = useFeature(CONTACTS_FEATURE_FLAG_KEYS[platform]);

  return useMemo(() => resolveContactsFeatureConfig(feature), [feature]);
}

function normalizeEligibleAddressFamilies(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every(family => typeof family === "string")) {
    return [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES];
  }

  const families = [...new Set(value.map(family => family.trim().toLowerCase()).filter(Boolean))];

  return families.length > 0 ? families : [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES];
}

function toContactsFeatureParamsInput(value: unknown):
  | Readonly<{
      newBadge?: unknown;
      eligibleAddressFamilies?: unknown;
      excludedCurrencyIds?: unknown;
    }>
  | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    newBadge: value.newBadge,
    eligibleAddressFamilies: value.eligibleAddressFamilies,
    excludedCurrencyIds: value.excludedCurrencyIds,
  };
}

function normalizeExcludedCurrencyIds(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every(id => typeof id === "string")) {
    return [];
  }

  return [...new Set(value.filter(Boolean))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
