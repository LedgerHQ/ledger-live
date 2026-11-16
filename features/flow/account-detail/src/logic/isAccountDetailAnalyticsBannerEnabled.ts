import type { AccountDetailFeature } from "./isAccountDetailEnabledFor";

export function isAccountDetailAnalyticsBannerEnabled(
  feature: AccountDetailFeature | null | undefined,
): boolean {
  return feature?.enabled === true && feature.params?.analyticsBanner === true;
}
