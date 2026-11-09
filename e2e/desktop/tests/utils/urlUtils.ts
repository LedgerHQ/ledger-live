export function doubleDecodeGoToURL(url: string): string {
  try {
    return decodeURIComponent(decodeURIComponent(url));
  } catch (err) {
    throw new Error(
      `Failed to double‐decode goToURL. Raw fragment: "${url}". Error: ${err instanceof Error ? err.message : err}`,
      { cause: err },
    );
  }
}

export const matchesAppPath =
  (expectedPath: RegExp) =>
  (url: URL): boolean => {
    const hashPath = url.hash.replace(/^#/, "");
    const currentPath = hashPath.startsWith("/") ? hashPath : `${url.pathname}${url.search}`;
    return expectedPath.test(currentPath);
  };

export const coinDetailUrlPattern = (assetId: string): RegExp => {
  const escaped = assetId.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(`/asset/${escaped}`);
};
