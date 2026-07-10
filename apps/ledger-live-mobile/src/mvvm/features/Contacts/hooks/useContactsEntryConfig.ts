import { resolveContactsFeatureConfig, useContactsFeature } from "@features/flow-contacts";
import type { ContactsEntryConfig } from "../types";

export const resolveContactsEntryConfig = resolveContactsFeatureConfig;

export function useContactsEntryConfig(): ContactsEntryConfig {
  return useContactsFeature("mobile");
}
