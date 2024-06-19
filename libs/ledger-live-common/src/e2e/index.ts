import { EnvName } from "@ledgerhq/live-env";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { getFeature, DEFAULT_FEATURES } from "../featureFlags";

export const getAllFeatureFlags = (
  appLanguage?: string,
): Partial<{ [key in FeatureId]: Feature }> => {
  const res: Partial<{ [key in FeatureId]: Feature }> = {};
  Object.keys(DEFAULT_FEATURES).forEach(k => {
    const key = k as keyof typeof DEFAULT_FEATURES;
    res[key] = getFeature({ key, appLanguage });
  });
  return res;
};

export const formatFlagsData = (data: Partial<{ [key in FeatureId]: Feature }>) => {
  let allureData = "";
  for (const [key, value] of Object.entries(data)) {
    if (!value) continue;
    if (!value.enabled) continue;
    allureData += `FF.${key} = ${value.enabled}\n`;

    const entries = {
      desktop_version: value.desktop_version,
      mobile_version: value.mobile_version,
      enabledOverriddenForCurrentVersion: value.enabledOverriddenForCurrentVersion,
      languages_whitelisted: value.languages_whitelisted?.join(", "),
      languages_blacklisted: value.languages_blacklisted?.join(", "),
      enabledOverriddenForCurrentLanguage: value.enabledOverriddenForCurrentLanguage,
      overridesRemote: value.overridesRemote,
      overriddenByEnv: value.overriddenByEnv,
      params: value.params ? JSON.stringify(value.params) : undefined,
    };

    for (const [field, fieldValue] of Object.entries(entries)) {
      if (fieldValue !== undefined) {
        allureData += `FF.${key}.${field} = ${fieldValue
          .toString()
          .replace(/^\{|\}$/g, "")
          .replace(/"/g, " ")}\n`;
      }
    }
  }
  return allureData;
};

export const formatEnvData = (data: { [key in EnvName]: unknown }) => {
  let allureData = "";
  for (const [key, value] of Object.entries(data)) {
    allureData += `ENV.${key} = ${value}\n`;
  }
  return allureData;
};
