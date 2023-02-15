const isValidUrl = urlString => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

export const getCustomDappUrl = (manifest, appId, genericParams, pathname = "") => {
  const isLocalPath = (typeof pathname === "string" && pathname[0] === "/") || pathname[0] === "#";
  const oldDappUrl = manifest?.params?.dappUrl;
  const isValidOldUrl = isValidUrl(oldDappUrl);
  const newUrl = isLocalPath ? `https://www.prefix.com${pathname}` : "";
  const isValidNewdUrl = isValidUrl(newUrl);
  if (isLocalPath && isValidOldUrl && isValidNewdUrl) {
    const { origin, search } = new URL(oldDappUrl);
    const { hash: fragment, searchParams } = new URL(newUrl);
    const [realFragment, query] = fragment.split("?");
    const urlSearchParams = new URLSearchParams(query);
    const allParams = {
      ...genericParams,
      ...Object.fromEntries(new URLSearchParams(search)),
      ...Object.fromEntries(urlSearchParams.entries()),
      ...Object.fromEntries(searchParams),
    };

    // Providers need to use the standard structure: query + fragment
    // https://www.rfc-editor.org/rfc/rfc3986#section-4.2
    // 1inch is not using the standard  (fragnment + query).
    // Refactor when the providers follow the standards.

    const newDappUrl =
      appId === "1inch"
        ? `${origin}${realFragment}?${new URLSearchParams(allParams).toString()}`
        : `${origin}?${new URLSearchParams(allParams).toString()}${realFragment}`;
    if (oldDappUrl !== newDappUrl) {
      return newDappUrl;
    }
  }
  return false;
};
