import semver from "semver";
import type { AppManifest, AppPlatform, AppBranch } from "./types";
import { getPlatformVersion } from "./version";

export function translateContent(content: any, locale = "en") {
  if (!content || typeof content !== "object") return content;
  return content[locale] || content.en;
}

export function isSupported(manifest: AppManifest) {
  return semver.satisfies(
    semver.coerce(getPlatformVersion()) || "",
    manifest.apiVersion
  );
}

export function matchBranches(manifest: AppManifest, branches: AppBranch[]) {
  return branches.indexOf(manifest.branch) > -1;
}

export function matchPlatform(manifest: AppManifest, platform: AppPlatform) {
  return manifest.platform === "all" || manifest.platform === platform;
}
