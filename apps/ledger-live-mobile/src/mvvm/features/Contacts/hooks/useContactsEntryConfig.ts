import {
  resolveContactsFeatureConfig,
  useContactsFeature,
  type ContactsFeatureConfig as ContactsEntryConfig,
} from "@features/flow-contacts";

export const resolveContactsEntryConfig = resolveContactsFeatureConfig;

export function useContactsEntryConfig(): ContactsEntryConfig {
  return useContactsFeature("mobile");
}
