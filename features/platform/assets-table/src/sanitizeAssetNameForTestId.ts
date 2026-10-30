export function sanitizeAssetNameForTestId(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9-]/g, "");
}
