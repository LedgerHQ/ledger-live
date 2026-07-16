/**
 * Native file delivery: prompts for a destination directory and writes the
 * payload there as a JSON file (SAF on Android, document picker on iOS).
 *
 * `expo-file-system` is imported lazily: it resolves its native module at
 * module-load (`requireNativeModule`), so a static import would crash any host
 * that hasn't linked it, even when the feature is UI-disabled.
 */
export async function saveFile(content: string, filename: string) {
  const { Directory } = await import("expo-file-system");

  const directory = await Directory.pickDirectoryAsync();
  const file = directory.createFile(filename, "application/json");
  file.write(content);
}
