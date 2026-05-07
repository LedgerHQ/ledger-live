import alpacaFamilies from "./alpacaFamilies.json";

export const alpacaizedFamilies = alpacaFamilies as Record<string, boolean>;

export function isAlpacaizedFamily(family: string): boolean {
  return alpacaizedFamilies[family] === true;
}

export function getEnabledAlpacaFamilies(): string[] {
  return Object.entries(alpacaizedFamilies)
    .filter(([, isEnabled]) => isEnabled)
    .map(([family]) => family);
}
