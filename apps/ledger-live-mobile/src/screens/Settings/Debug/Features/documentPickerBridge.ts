type DocumentPickerModule = typeof import("@react-native-documents/picker");

let cachedDocumentPicker: DocumentPickerModule | null = null;

/**
 * Repack lazy-imports can break `import * as` for this pure ESM package
 * (`_picker().pick is not a function`). Require the module synchronously instead.
 */
export function getDocumentPicker(): DocumentPickerModule {
  if (cachedDocumentPicker) {
    return cachedDocumentPicker;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require("@react-native-documents/picker") as DocumentPickerModule & {
    default?: DocumentPickerModule;
  };

  if (typeof module.pick === "function" && typeof module.keepLocalCopy === "function") {
    cachedDocumentPicker = module;
    return module;
  }

  if (
    module.default &&
    typeof module.default.pick === "function" &&
    typeof module.default.keepLocalCopy === "function"
  ) {
    cachedDocumentPicker = module.default;
    return module.default;
  }

  throw new Error(
    "Document picker module failed to load. Rebuild the native app after installing the dependency (pnpm ios or pnpm android).",
  );
}

export function isDocumentPickerCancelled(error: unknown): boolean {
  const { isErrorWithCode, errorCodes } = getDocumentPicker();
  return isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED;
}
