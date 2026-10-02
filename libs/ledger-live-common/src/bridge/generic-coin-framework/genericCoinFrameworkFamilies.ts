import genericCoinFrameworkFamilies from "./genericCoinFrameworkFamilies.json";

export const genericCoinFrameworkFamilyFlags = genericCoinFrameworkFamilies as Record<
  string,
  boolean
>;

export function isGenericCoinFrameworkFamily(family: string): boolean {
  return genericCoinFrameworkFamilyFlags[family] === true;
}

export function getEnabledGenericCoinFrameworkFamilies(): string[] {
  return Object.entries(genericCoinFrameworkFamilyFlags)
    .filter(([, isEnabled]) => isEnabled)
    .map(([family]) => family);
}
