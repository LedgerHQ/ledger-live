import type { PartialFeatures } from "./data/schema";

export interface ResolutionConfig {
  platform?: "desktop" | "ios" | "android";
  appVersion?: string;
  appLanguage?: string;
  envFlags?: PartialFeatures;
}

let resolutionConfig: ResolutionConfig = {};

/**
 * Sets the module-level resolution config used by the feature flags slice to
 * resolve flags at write time. Should be called once at application startup.
 * The config is deep-cloned to prevent external mutation.
 *
 * @param config
 * Platform, version, language, and env flags for resolution.
 */
export function setResolutionConfig(config: ResolutionConfig): void {
  resolutionConfig = Object.freeze(structuredClone(config));
}

/**
 * Returns the current resolution config as a readonly reference.
 *
 * @return
 * The frozen resolution config.
 */
export function getResolutionConfig(): Readonly<ResolutionConfig> {
  return resolutionConfig;
}
