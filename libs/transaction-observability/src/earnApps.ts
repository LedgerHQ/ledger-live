/** Manifest ids the Earn live app ships under; the `ptxEarnLiveApp` flag can add another. */
const DEFAULT_EARN_MANIFEST_IDS = new Set(["earn", "earn-stg", "earn-stg-eks", "earn-prd-eks"]);

type EarnManifestIdReader = () => string | undefined;

let readConfiguredManifestId: EarnManifestIdReader | null = null;

/**
 * Injects the manifest id the host resolved from `ptxEarnLiveApp`, so a renamed or staging
 * manifest is monitored without a client release. The default ids always stay recognised.
 */
export function setEarnManifestIdReader(reader: EarnManifestIdReader | null): void {
  readConfiguredManifestId = reader;
}

function configuredManifestId(): string | undefined {
  try {
    return readConfiguredManifestId?.() || undefined;
  } catch {
    return undefined;
  }
}

/** Whether a manifest is the Earn live app, as opposed to a partner dApp. */
export function isEarnApp(manifestId: string | undefined): boolean {
  if (manifestId === undefined) return false;
  return DEFAULT_EARN_MANIFEST_IDS.has(manifestId) || manifestId === configuredManifestId();
}
