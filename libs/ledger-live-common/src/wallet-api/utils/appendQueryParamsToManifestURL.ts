import { LiveAppManifest } from "../../platform/types";
import { extractURLFromManifest } from "./extractURLFromManifest";

/** Appends query params to dapp URL or live app URL that might contain existing search params. */
export function appendQueryParamsToManifestURL(
  manifest: LiveAppManifest,
  queryString: Record<string, string | string[]> = {},
): URL | undefined {
  const url = extractURLFromManifest(manifest);

  if (!url) {
    return undefined;
  }

  const searchParams = new URLSearchParams(url.search);

  // Append the new query strings to the existing ones
  Object.entries(queryString).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => searchParams.append(key, item));
    } else {
      searchParams.append(key, value);
    }
  });

  url.search = searchParams.toString();

  return url;
}
