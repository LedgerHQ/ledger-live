import { EnvName } from "@ledgerhq/live-env";
import { FEATURE_FLAGS_DEFAULTS, type Feature, type FeatureId } from "@shared/feature-flags";
import axios, { AxiosError } from "axios";

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getAllFeatureFlags = (
  getFeature: (key: FeatureId) => Feature | null,
): Partial<{ [key in FeatureId]: Feature }> => {
  const res: Partial<{ [key in FeatureId]: Feature }> = {};
  (Object.keys(FEATURE_FLAGS_DEFAULTS) as FeatureId[]).forEach(key => {
    const value = getFeature(key);
    if (value !== null) res[key] = value;
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

const SENSITIVE_ENV_KEYS: Set<string> = new Set(["SEED"]);

export const formatEnvData = (data: { [key in EnvName]: unknown }) => {
  let allureData = "";
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_ENV_KEYS.has(key)) continue;
    allureData += `ENV.${key} = ${value}\n`;
  }
  return allureData;
};

/**
 * Sanitizes an error to remove circular references (e.g., from AxiosError objects).
 * This prevents Jest serialization failures when processing test results.
 * Always returns a clean Error object with only serializable properties.
 */
export const sanitizeError = (error: unknown): Error => {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      // Create a new clean error to avoid any circular references
      const sanitized = new Error(error.message);
      sanitized.name = error.name;
      if (error.stack) {
        sanitized.stack = error.stack;
      }
      const runId = (error as { runId?: unknown }).runId;
      if (typeof runId === "string") {
        Object.assign(sanitized, { runId });
      }
      return sanitized;
    }
    return new Error(String(error ?? "Unknown error"));
  }

  const err = error as AxiosError;
  const sanitized = new Error(err.message || "Axios request failed");

  Object.assign(sanitized, {
    name: err.name,
    code: err.code,
    url: err.config?.url,
    method: err.config?.method,
    status: err.response?.status,
  });

  return sanitized;
};
