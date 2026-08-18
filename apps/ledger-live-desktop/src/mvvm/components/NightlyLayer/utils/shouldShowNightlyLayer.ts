export function shouldShowNightlyLayer(isPrerelease: unknown, channel: unknown): boolean {
  if (!isPrerelease || isPrerelease === "null" || isPrerelease === "false") {
    return false;
  }

  if (typeof channel !== "string" || channel === "null") {
    return false;
  }

  return channel !== "next" && !channel.includes("sha");
}
