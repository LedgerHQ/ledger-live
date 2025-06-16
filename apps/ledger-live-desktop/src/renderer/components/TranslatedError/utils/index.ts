function getSafeStringLinks(error?: Error | null): string[] {
  return error && typeof error === "object" && "links" in error && Array.isArray(error.links)
    ? error.links.filter((link): link is string => typeof link === "string")
    : [];
}

function isAbsoluteUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export { getSafeStringLinks, isAbsoluteUrl };
