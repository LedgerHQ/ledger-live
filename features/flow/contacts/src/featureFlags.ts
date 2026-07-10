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
}>;

export type ContactsFeatureValue = Features["lwdContacts"] | Features["lwmContacts"];

export function resolveContactsFeatureConfig(
  feature: ContactsFeatureValue | null | undefined,
): ContactsFeatureConfig {
  const isEnabled = feature?.enabled === true;

  return {
    isEnabled,
    showNewBadge: isEnabled && feature?.params?.newBadge === true,
    eligibleAddressFamilies:
      feature?.params?.eligibleAddressFamilies ?? DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
  };
}

export function useContactsFeature(platform: ContactsFeaturePlatform): ContactsFeatureConfig {
  const feature = useFeature(CONTACTS_FEATURE_FLAG_KEYS[platform]);

  return useMemo(() => resolveContactsFeatureConfig(feature), [feature]);
}
