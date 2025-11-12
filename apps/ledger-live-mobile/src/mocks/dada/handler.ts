import { http, HttpResponse } from "msw";
import { mockData, mockDataCosmos } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";

const handler = ({ request }: { request: Request }) => {
  const searchParams = new URL(request.url).searchParams;
  const search = searchParams.get("search")?.toLowerCase().trim();
  const currencyIds = searchParams.get("currencyIds");

  if (currencyIds) {
    const mockedData = currencyIds.includes("cosmos") ? mockDataCosmos : mockData;

    const requestedIds = currencyIds.split(",");
    const filteredCryptoAssets = Object.fromEntries(
      Object.entries(mockedData.cryptoAssets).filter(([id]) => requestedIds.includes(id)),
    );
    const filteredCryptoOrTokenCurrencies = Object.fromEntries(
      Object.entries(mockedData.cryptoOrTokenCurrencies).filter(([id]) =>
        requestedIds.includes(id),
      ),
    );

    const response = {
      ...mockedData,
      cryptoAssets: filteredCryptoAssets,
      cryptoOrTokenCurrencies: filteredCryptoOrTokenCurrencies,
    };
    return HttpResponse.json(response);
  }

  // Handle search parameter
  if (search) {
    const filteredEntries = Object.entries(mockData.cryptoAssets).filter(([, asset]) => {
      const name = asset.name?.toLowerCase() ?? "";
      const ticker = asset.ticker?.toLowerCase() ?? "";
      return name.includes(search) || ticker.includes(search);
    });

    const matchingMetaCurrencyIds = filteredEntries.map(([id]) => id);
    const filteredCryptoAssets = Object.fromEntries(filteredEntries);
    const response = {
      ...mockData,
      cryptoAssets: filteredCryptoAssets,
      currenciesOrder: {
        ...mockData.currenciesOrder,
        metaCurrencyIds: matchingMetaCurrencyIds,
      },
    };
    return HttpResponse.json(response);
  }

  return HttpResponse.json(mockData);
};

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", handler),
  http.get("https://dada.api.ledger.com/v1/assets", handler),
];

export default handlers;
