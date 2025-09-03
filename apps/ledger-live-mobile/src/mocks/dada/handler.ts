import { http, HttpResponse } from "msw";
import { mockData } from "@ledgerhq/live-common/modularDrawer/__mocks__/dada.mock";

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get("search")?.toLowerCase().trim();

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
  }),
];

export default handlers;
