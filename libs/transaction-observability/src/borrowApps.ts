/** Manifest id the Borrow live app ships under; the `ptxBorrowLiveApp` flag can override it. */
const DEFAULT_BORROW_MANIFEST_ID = "borrow";

type BorrowManifestIdReader = () => string | undefined;

let readConfiguredManifestId: BorrowManifestIdReader | null = null;

/**
 * Injects the manifest id the host resolved from `ptxBorrowLiveApp`, so a renamed or staging
 * manifest is monitored without a client release. The default id always stays recognised.
 */
export function setBorrowManifestIdReader(reader: BorrowManifestIdReader | null): void {
  readConfiguredManifestId = reader;
}

function configuredManifestId(): string | undefined {
  try {
    return readConfiguredManifestId?.() || undefined;
  } catch {
    return undefined;
  }
}

/** Whether a manifest is the Borrow live app. */
export function isBorrowApp(manifestId: string | undefined): boolean {
  if (manifestId === undefined) return false;
  return manifestId === DEFAULT_BORROW_MANIFEST_ID || manifestId === configuredManifestId();
}
