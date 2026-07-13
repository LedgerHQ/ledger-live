import {
  resolveContactsFeatureConfig,
  useContactsFeature,
} from "@features/flow-contacts/featureFlags";
import type { ContactsFeatureConfig as ContactsEntryConfig } from "@features/flow-contacts/featureFlags";

export const resolveContactsEntryConfig = resolveContactsFeatureConfig;

export function useContactsEntryConfig(): ContactsEntryConfig {
  return useContactsFeature("mobile");
}
