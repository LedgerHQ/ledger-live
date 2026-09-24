const FIREBASE_FEATURE_PREFIX = "feature_";

export type RemoteConfigValue = {
  getSource(): string;
  asString(): string;
};

export type ContentAbTestTrackingConfiguration = {
  ptxEventProperty: string;
  ptxEventValue: string;
};

export type ContentAbTestPayload = {
  enabled: boolean;
  copy: Record<string, string>;
  trackingConfiguration?: ContentAbTestTrackingConfiguration;
};

export type ContentAbTests = Record<string, ContentAbTestPayload>;

/**
 * Firebase key → in-app id (`feature_upgrade_banner` → `upgradeBanner`).
 * Open-set keys cannot invert FeatureIdSchema; ids with internal digits
 * (`web3hub`) do not round-trip through snake_case. Prefer digit-free camelCase
 * experiment names.
 */
export function firebaseKeyToContentAbTestId(key: string): string | null {
  const lower = key.toLowerCase();
  if (!lower.startsWith(FIREBASE_FEATURE_PREFIX)) return null;
  const id = snakeSuffixToCamelId(lower.slice(FIREBASE_FEATURE_PREFIX.length));
  return id.length > 0 ? id : null;
}

function snakeSuffixToCamelId(suffix: string): string {
  return suffix.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

export function parseContentAbTestPayload(value: unknown): ContentAbTestPayload | null {
  if (!isPlainObject(value) || typeof value.enabled !== "boolean") {
    return null;
  }

  const trackingConfiguration = parseTrackingConfiguration(value.trackingConfiguration);
  if (trackingConfiguration === "invalid") return null;

  return {
    enabled: value.enabled,
    copy: collectCopy(value),
    ...(trackingConfiguration ? { trackingConfiguration } : {}),
  };
}

export function parseContentAbTests(all: Record<string, RemoteConfigValue>): ContentAbTests {
  const flags: ContentAbTests = {};
  for (const [key, value] of Object.entries(all)) {
    if (value.getSource() !== "remote") continue;
    const id = firebaseKeyToContentAbTestId(key);
    if (!id) continue;
    try {
      const payload = parseContentAbTestPayload(JSON.parse(value.asString()));
      if (payload) flags[id] = payload;
    } catch {
      // Malformed JSON in remote config — drop this key, fall back to app.json.
    }
  }
  return flags;
}

function parseTrackingConfiguration(
  value: unknown,
): ContentAbTestTrackingConfiguration | undefined | "invalid" {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) return "invalid";
  const { ptxEventProperty, ptxEventValue } = value;
  if (
    typeof ptxEventProperty !== "string" ||
    ptxEventProperty.length === 0 ||
    typeof ptxEventValue !== "string" ||
    ptxEventValue.length === 0
  ) {
    return "invalid";
  }
  return { ptxEventProperty, ptxEventValue };
}

function collectCopy(value: Record<string, unknown>): Record<string, string> {
  const copy: Record<string, string> = {};
  if (isPlainObject(value.copy)) {
    for (const [key, entry] of Object.entries(value.copy)) {
      if (typeof entry === "string") copy[key] = entry;
    }
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key === "enabled" || key === "copy" || key === "trackingConfiguration") continue;
    if (typeof entry === "string") copy[key] = entry;
  }
  return copy;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
