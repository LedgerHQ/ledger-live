/**
 * Native file picker: opens the document picker and resolves with the selected
 * file's text content.
 *
 * The native modules are imported lazily: `expo-document-picker` resolves its
 * native module at module-load (`requireNativeModule`), so a static import would
 * crash any host that hasn't linked it, even when the feature is UI-disabled.
 */
export async function readFile(): Promise<string> {
  const DocumentPicker = await import("expo-document-picker");
  const { File } = await import("expo-file-system");

  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  const asset = result.assets?.[0];
  if (result.canceled || !asset) {
    throw new Error("No file selected");
  }
  return new File(asset.uri).text();
}
