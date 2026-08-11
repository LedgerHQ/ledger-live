import { defaultAnalyticsConsentInfo, type AnalyticsConsentInfo } from "./schema";

export function mockAnalyticsConsentInfo(
  overrides?: Partial<AnalyticsConsentInfo>,
): AnalyticsConsentInfo {
  return { ...defaultAnalyticsConsentInfo, ...overrides };
}
