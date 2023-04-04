export const FILTER = {
  centralised: "centralised",
  decentralised: "decentralised",
  float: "float",
  fixed: "fixed",
};
const isValidUrl = urlString => {
  try {
    return Boolean(new URL(urlString));
  } catch (e) {
    return false;
  }
};

// Back-end is not retriving the correct URL.

// backend: /platform/paraswap/#/0xdac17f958d2ee523a2206206994597c13d831ec7-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599/21.3?network=1
// real: https://embedded.paraswap.io?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false&network=1#/0xdac17f958d2ee523a2206206994597c13d831ec7-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599/21.3

// backend: /platform/1inch/#/1/unified/swap/usdt/shib?sourceTokenAmount=24.6
// real: https://app.1inch.io/#/1/simple/swap/usdt/shib?ledgerLive=true&sourceTokenAmount=24.6

export const getCustomDappUrl = ({ provider, providerURL = "" }) => {
  // To support when bk apply set the complete URL
  if (isValidUrl(providerURL)) {
    return providerURL;
  }
  const dappUrl =
    provider === "paraswap"
      ? "https://embedded.paraswap.io/?referrer=ledger2&embed=true&enableStaking=false&displayMenu=false&enableNetworkSwitch=false"
      : "https://app.1inch.io/?ledgerLive=true";
  const newUrl = `https://www.prefix.com/${providerURL}`;
  const isValidNewdUrl = isValidUrl(newUrl);
  if (isValidNewdUrl) {
    const { origin, search } = new URL(dappUrl);
    const { hash: fragment, searchParams } = new URL(newUrl);
    const [realFragment, query] = fragment.split("?");
    const urlSearchParams = new URLSearchParams(query);
    const allParams = {
      ...Object.fromEntries(new URLSearchParams(search)),
      ...Object.fromEntries(urlSearchParams.entries()),
      ...Object.fromEntries(searchParams),
    };

    // Providers need to use the standard structure: query + fragment
    // https://www.rfc-editor.org/rfc/rfc3986#section-4.2
    // 1inch is not using the standard  (fragnment + query).
    // Refactor when the providers follow the standards.

    const newDappUrl =
      provider === "oneinch"
        ? `${origin}/${realFragment}?${new URLSearchParams(allParams).toString()}`.replace(
            "/unified/",
            "/simple/",
          )
        : `${origin}?${new URLSearchParams(allParams).toString()}${realFragment}`;
    return newDappUrl;
  }
  return false;
};
