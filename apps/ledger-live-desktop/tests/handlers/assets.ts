import { http, HttpResponse } from "msw";
import jsonResponse from "./fixtures/assets/getAssets.json";
import { RawApiResponse } from "@ledgerhq/live-common/dada-client/entities/index";

const handleEthereumAssets = (
  name: "ethereum" | "arbitrum" | "base" | "scroll",
  res: RawApiResponse,
) => {
  if (!res.cryptoAssets["urn:crypto:meta-currency:ethereum"]) {
    Object.assign(res.cryptoAssets, {
      "urn:crypto:meta-currency:ethereum": {
        ...jsonResponse.cryptoAssets["urn:crypto:meta-currency:ethereum"],
        assetsIds: { [name]: name },
      },
    });
  } else {
    Object.assign(res.cryptoAssets["urn:crypto:meta-currency:ethereum"].assetsIds, {
      [name]: name,
    });
  }
  Object.assign(res.networks, {
    [name]: { ...jsonResponse.networks[name] },
  });
  Object.assign(res.cryptoOrTokenCurrencies, {
    [name]: { ...jsonResponse.cryptoOrTokenCurrencies[name] },
  });
  Object.assign(res.interestRates, {
    ethereum: { ...jsonResponse.interestRates.ethereum },
  });
  Object.assign(res.markets, {
    [name]: { ...jsonResponse.markets[name] },
  });

  if (!res.currenciesOrder.metaCurrencyIds.includes("urn:crypto:meta-currency:ethereum")) {
    res.currenciesOrder.metaCurrencyIds.push("urn:crypto:meta-currency:ethereum");
  }
};

// Mock the currencyIds DADA query param
const handleFilteredCurrencyIds = (currencyIds: string[]) => {
  const hasEthereum = currencyIds.includes("ethereum");
  const hasArbitrum = currencyIds.includes("arbitrum");
  const hasBase = currencyIds.includes("base");
  const hasScroll = currencyIds.includes("scroll");
  const hasBitcoin = currencyIds.includes("bitcoin");
  const hasUsdCoin = currencyIds.includes("ethereum/erc20/usd__coin");

  const res: RawApiResponse = {
    cryptoAssets: {},
    networks: {},
    cryptoOrTokenCurrencies: {},
    interestRates: {},
    markets: {},
    currenciesOrder: {
      key: "marketCap",
      order: "desc",
      metaCurrencyIds: [],
    },
  };

  if (hasEthereum) {
    handleEthereumAssets("ethereum", res);
  }

  if (hasArbitrum) {
    handleEthereumAssets("arbitrum", res);
  }

  if (hasBase) {
    handleEthereumAssets("base", res);
  }

  if (hasScroll) {
    handleEthereumAssets("scroll", res);
  }

  if (hasBitcoin) {
    Object.assign(res.cryptoAssets, {
      bitcoin: {
        ...jsonResponse.cryptoAssets.bitcoin,
      },
    });
    Object.assign(res.networks, {
      bitcoin: { ...jsonResponse.networks.bitcoin },
    });
    Object.assign(res.cryptoOrTokenCurrencies, {
      bitcoin: { ...jsonResponse.cryptoOrTokenCurrencies.bitcoin },
    });
    Object.assign(res.interestRates, {
      bitcoin: {
        currencyId: "bitcoin",
        rate: 0,
        type: "APY",
        fetchAt: "2025-09-23T13:13:12.088142Z",
      },
    });
    Object.assign(res.markets, {
      bitcoin: { ...jsonResponse.markets.bitcoin },
    });
    res.currenciesOrder.metaCurrencyIds.push("bitcoin");
  }

  if (hasUsdCoin) {
    Object.assign(res.cryptoAssets, {
      "urn:crypto:meta-currency:usd_coin": {
        ...jsonResponse.cryptoAssets["urn:crypto:meta-currency:usd_coin"],
      },
    });
    Object.assign(res.networks, {
      ethereum: { ...jsonResponse.networks.ethereum },
    });
    Object.assign(res.cryptoOrTokenCurrencies, {
      "ethereum/erc20/usd__coin": {
        ...jsonResponse.cryptoOrTokenCurrencies["ethereum/erc20/usd__coin"],
      },
    });
    Object.assign(res.interestRates, {
      "ethereum/erc20/usd__coin": { ...jsonResponse.interestRates["ethereum/erc20/usd__coin"] },
    });
    Object.assign(res.markets, {
      "ethereum/erc20/usd__coin": { ...jsonResponse.markets["ethereum/erc20/usd__coin"] },
    });
    res.currenciesOrder.metaCurrencyIds.push("urn:crypto:meta-currency:usd_coin");
  }

  return HttpResponse.json(res);
};

const handler = ({ request }: { request: Request }) => {
  const searchParams = new URL(request.url).searchParams;
  const search = searchParams.get("search")?.toLowerCase().trim();

  const currencyIds = searchParams.get("currencyIds")?.trim().toLowerCase().split(",") || [];

  if (currencyIds.length) {
    return handleFilteredCurrencyIds(currencyIds);
  }

  if (search) {
    const filteredEntries = Object.entries(jsonResponse.cryptoAssets).filter(([, asset]) => {
      const name = asset.name?.toLowerCase() ?? "";
      const ticker = asset.ticker?.toLowerCase() ?? "";
      return name.includes(search) || ticker.includes(search);
    });

    const matchingMetaCurrencyIds = filteredEntries.map(([id]) => id);
    const filteredCryptoAssets = Object.fromEntries(filteredEntries);
    const response = {
      ...jsonResponse,
      cryptoAssets: filteredCryptoAssets,
      currenciesOrder: {
        ...jsonResponse.currenciesOrder,
        metaCurrencyIds: matchingMetaCurrencyIds,
      },
    };
    return HttpResponse.json(response);
  }

  return HttpResponse.json(jsonResponse);
};

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", handler),
  http.get("https://dada.api.ledger.com/v1/assets", handler),
];

export default handlers;
