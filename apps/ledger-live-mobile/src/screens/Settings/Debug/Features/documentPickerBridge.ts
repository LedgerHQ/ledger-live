/**
 * Repack-safe bridge for `@react-native-documents/picker` (11.0.4).
 * Debug-only: lets designers pick local `.lottie` files from the system picker.
 * Bundle impact: https://bundlephobia.com/package/@react-native-documents/picker@11.0.4
 */
type DocumentPickerModule = typeof import("@react-native-documents/picker");

let cachedDocumentPicker: DocumentPickerModule | null = null;

function isDocumentPickerModule(value: unknown): value is DocumentPickerModule {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<DocumentPickerModule>;
  return (
    typeof candidate.pick === "function" &&
    typeof candidate.keepLocalCopy === "function" &&
    typeof candidate.isErrorWithCode === "function" &&
    typeof candidate.errorCodes === "object" &&
    candidate.errorCodes !== null &&
    "OPERATION_CANCELED" in candidate.errorCodes
  );
}

function loadDocumentPickerModule(): DocumentPickerModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded: unknown = require("@react-native-documents/picker");

  if (isDocumentPickerModule(loaded)) {
    return loaded;
  }

  if (typeof loaded === "object" && loaded !== null && "default" in loaded) {
    const { default: defaultExport } = loaded as { default?: unknown };
    if (isDocumentPickerModule(defaultExport)) {
      return defaultExport;
    }
  }

  throw new Error(
    "Document picker module failed to load. Rebuild the native app after installing the dependency (pnpm ios or pnpm android).",
  );
}

/**
 * Repack lazy-imports can break `import * as` for this pure ESM package
 * (`_picker().pick is not a function`). Require the module synchronously instead.
 */
export function getDocumentPicker(): DocumentPickerModule {
  if (cachedDocumentPicker) {
    return cachedDocumentPicker;
  }

  cachedDocumentPicker = loadDocumentPickerModule();
  return cachedDocumentPicker;
}

export function isDocumentPickerCancelled(error: unknown): boolean {
  const { isErrorWithCode, errorCodes } = getDocumentPicker();
  return isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;
}
