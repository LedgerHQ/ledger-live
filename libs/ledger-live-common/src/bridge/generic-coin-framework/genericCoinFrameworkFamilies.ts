import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import genericCoinFrameworkFamilies from "./genericCoinFrameworkFamilies.json";

export const genericCoinFrameworkFamilyFlags = genericCoinFrameworkFamilies as Record<
  string,
  boolean
>;

export function isGenericCoinFrameworkFamily(family: string): boolean {
  return genericCoinFrameworkFamilyFlags[family] === true;
}

// A flag change takes effect after app restart or clearBridgeCache(family).
const GENERIC_BRIDGE_FLAGS: Record<string, string> = {
  // Casper shipped on the old bridge before LIVE-35912; seedIdentifier format changed
  // (raw pubkey → tagged address). sameAccountIdentity's freshAddress fallback handles
  // re-scans, but id-keyed settings (account name, etc.) reset on the first rescan.
  casper: "config_casper_generic_bridge",
  hedera: "config_hedera_generic_bridge",
};

export function isGenericBridgeFlagEnabled(family: string) {
  const flag = GENERIC_BRIDGE_FLAGS[family];
  return !flag || LiveConfig.getValueByKey(flag);
}

export function getEnabledGenericCoinFrameworkFamilies(): string[] {
  return Object.entries(genericCoinFrameworkFamilyFlags)
    .filter(([, isEnabled]) => isEnabled)
    .map(([family]) => family);
}
