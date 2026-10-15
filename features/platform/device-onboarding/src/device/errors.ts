const refusedByUserTag = "RefusedByUserDAError";
const secureChannelTags = new Set(["SecureChannelError", "WebSocketConnectionError"]);
/** DMK's `HttpFetchApiError`, which every manager catalogue call rejects with, is tagged `FetchError`. */
const catalogueTag = "FetchError";

export function isDeviceRefusal(error: unknown): boolean {
  return errorTag(error) === refusedByUserTag;
}

export function isSecureChannelLost(error: unknown): boolean {
  const tag = errorTag(error);

  return tag !== undefined && secureChannelTags.has(tag);
}

export function isCatalogueUnreachable(error: unknown): boolean {
  return errorTag(error) === catalogueTag;
}

function errorTag(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("_tag" in error)) {
    return undefined;
  }

  const { _tag } = error as { _tag: unknown };

  return typeof _tag === "string" ? _tag : undefined;
}
