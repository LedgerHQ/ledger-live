import semver from "semver";

import { QuotesErrorCodes, type QuotesAppPlatform, type QuotesError } from "./types";

type VersionCompatibilityRule = {
  id: string;
  token: "none" | "only" | "all";
  lld: string | null;
  llm: string | null;
};

const VERSION_COMPATIBILITY_RULES: VersionCompatibilityRule[] = [
  { id: "aptos", token: "none", lld: "2.82.0", llm: null },
  { id: "sui", token: "all", lld: "2.120.1", llm: "3.86.0" },
  { id: "ton", token: "only", lld: "2.120.0", llm: "3.84.0" },
  { id: "solana", token: "only", lld: null, llm: "3.76.0" },
];

function getRequiredVersion(
  platform: QuotesAppPlatform,
  rule: VersionCompatibilityRule,
): string | null {
  switch (platform) {
    case "lld":
      return rule.lld;
    case "llm-ios":
    case "llm-android":
      return rule.llm;
    case "unknown":
      return null;
  }
}

function isVersionLowerThanRequired(currentVersion: string, requiredVersion: string): boolean {
  const current = semver.coerce(currentVersion, { includePrerelease: true });
  const required = semver.coerce(requiredVersion, { includePrerelease: true });
  if (!current || !required) {
    return false;
  }

  return semver.lt(current, required, { includePrerelease: true });
}

function matchesRule(currencyId: string, rule: VersionCompatibilityRule): boolean {
  switch (rule.token) {
    case "none":
      return currencyId === rule.id;
    case "only":
      return currencyId.startsWith(`${rule.id}/`);
    case "all":
      return currencyId === rule.id || currencyId.startsWith(`${rule.id}/`);
  }
}

export function computeLedgerLiveVersionCompatibilityError(input: {
  sendCurrencyId: string;
  receiveCurrencyId: string;
  appVersion?: {
    platform: QuotesAppPlatform;
    version: string | null;
  };
}): QuotesError | undefined {
  const appVersion = input.appVersion;
  if (!appVersion?.version) {
    return undefined;
  }

  const currencyIds = [input.sendCurrencyId, input.receiveCurrencyId];
  for (const rule of VERSION_COMPATIBILITY_RULES) {
    const requiredVersion = getRequiredVersion(appVersion.platform, rule);
    if (!requiredVersion || !isVersionLowerThanRequired(appVersion.version, requiredVersion)) {
      continue;
    }

    const currencyId = currencyIds.find(id => matchesRule(id, rule));
    if (currencyId) {
      return {
        code: QuotesErrorCodes.LEDGER_LIVE_VERSION_INCOMPATIBILITY,
        currencyId,
        platform: appVersion.platform,
        currentVersion: appVersion.version,
        requiredVersion,
      };
    }
  }

  return undefined;
}
