import cloneDeep from "lodash/cloneDeep";
import type { Feature, FeatureId } from "./data/schema";

export interface ResolutionConfig {
  platform?: "desktop" | "ios" | "android";
  appVersion?: string;
  appLanguage?: string;
  envFlags?: { [key in FeatureId]?: Feature | undefined };
}

let resolutionConfig: ResolutionConfig = {};

export function setResolutionConfig(config: ResolutionConfig): void {
  resolutionConfig = cloneDeep(config);
}

export function getResolutionConfig(): Readonly<ResolutionConfig> {
  return resolutionConfig;
}
