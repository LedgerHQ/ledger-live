export function getValidDappURL(dappURL?: string): URL | undefined {
  if (dappURL) {
    try {
      const url = new URL(dappURL);
      return url;
    } catch (error) {
      // Invalid URL
      return undefined;
    }
  }

  return undefined;
}
