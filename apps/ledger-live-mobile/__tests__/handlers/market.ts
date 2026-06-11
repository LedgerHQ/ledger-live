import { http, HttpResponse } from "msw";
import marketsMock from "@mocks/api/market/markets.json";

const stockMarketsMock: typeof marketsMock = [
  {
    ...marketsMock[0],
    id: "tesla-xstock",
    ledgerIds: [
      "ethereum/erc20/tesla_xstock_0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0",
      "solana/spl/tesla_xstock_xsdovfqebukxuzhwhdvwhbhgehjgnst4mlodqsjhzob",
    ],
    ticker: "tslax",
    name: "Tesla xStock",
    marketCap: 58_043_054,
    marketCapRank: 528,
    price: 411.28,
    priceChangePercentage24h: -2.76,
  },
  {
    ...marketsMock[0],
    id: "nvidia-ondo-tokenized-stock",
    ledgerIds: [
      "ethereum/erc20/nvidia_ondo_tokenized_0x2d1f7226bd1f780af6b9a49dcc0ae00e8df4bdee",
      "solana/spl/nvidia_ondo_tokenized_gegtltpnq7jcg25ztetkbmf7teodlcrftnqfmn2ondo",
    ],
    ticker: "nvdaon",
    name: "NVIDIA (Ondo Tokenized Stock)",
    marketCap: 57_923_021,
    marketCapRank: 533,
    price: 213.27,
    priceChangePercentage24h: 0.74,
  },
  {
    ...marketsMock[0],
    id: "rif-token",
    ledgerIds: ["rsk/erc20/rif"],
    ticker: "rif",
    name: "Rootstock Infrastructure Framework",
    marketCap: 115_003_200,
    marketCapRank: 412,
    price: 0.07,
  },
];

const handlers = [
  http.get("https://countervalues.live.ledger.com/v3/markets", ({ request }) => {
    const searchParams = new URL(request.url).searchParams;

    let filteredData = marketsMock;

    if (searchParams.get("filter") === "stock") {
      filteredData = stockMarketsMock;
    }
    // When we perform a search
    else if (searchParams.get("filter")) {
      const coins = searchParams.get("filter")?.toLowerCase().split(",") || [];
      filteredData = marketsMock.filter(({ name, ticker }) =>
        coins.some(
          coin => ticker.toLowerCase().includes(coin) || name.toLowerCase().includes(coin),
        ),
      );
    }
    // When we perform starred
    else if (searchParams.get("ids")) {
      const coins = searchParams.get("ids")?.split(",") || [];
      filteredData = marketsMock.filter(({ id }) => coins.includes(id));
    }

    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = 10;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return HttpResponse.json(paginatedData);
  }),
  http.get("https://countervalues.live.ledger.com/v3/supported/fiat", () => {
    return HttpResponse.json(["usd", "eur", "gbp"]);
  }),
  http.get("https://countervalues.live.ledger.com/v3/markets/chart/:range/:id", () => {
    return HttpResponse.json({
      values: [
        [1700000000000, 50000],
        [1700003600000, 50100],
      ],
    });
  }),
];

export default handlers;
