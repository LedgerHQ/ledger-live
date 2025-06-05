export function doubleDecodeGoToURL(url: string): string {
  try {
    return decodeURIComponent(decodeURIComponent(url));
  } catch (err) {
    throw new Error(
      `Failed to double‐decode goToURL. Raw fragment: "${url}". Error: ${err instanceof Error ? err.message : err}`,
    );
  }
}
