import { Manifest } from "~/types/manifest";
import { getValidDappURLFromManifest } from "./getValidDappURLFromManifest";

export function generateValidDappURLWithParams(
  manifest: Manifest,
  queryString: Record<string, string | string[]> = {},
): URL | undefined {
  const url = getValidDappURLFromManifest(manifest);

  if (url) {
    const searchParams = new URLSearchParams(url.search);

    // Append the new query strings to the existing ones
    Object.entries(queryString).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    });

    // Update the search property of the URL with the updated search params
    url.search = searchParams.toString();

    return url;
  }

  return undefined;
}
