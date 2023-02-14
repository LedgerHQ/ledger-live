import {
  CurrencyData,
  MarketCoin,
  MarketListRequestParams,
  SupportedCoins,
} from "../types";
import { listCryptoCurrencies, listTokens } from "../../currencies";

const cryptoCurrenciesList = [...listCryptoCurrencies(), ...listTokens()];

async function setSupportedCoinsList(): Promise<SupportedCoins> {
  const response = await Promise.resolve([
    { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
    { id: "ethereum", symbol: "eth", name: "Ethereum" },
    { id: "ethereum-apex", symbol: "eapex", name: "Ethereum Apex" },
    { id: "ethereum-cash", symbol: "ecash", name: "Ethereum Cash" },
  ]);

  return response;
}

const matchSearch =
  (search: string) =>
  (currency: MarketCoin): boolean => {
    if (!search) return false;
    const match = `${currency.symbol}|${currency.name}`;
    return match.toLowerCase().includes(search.toLowerCase());
  };

const paginatedData = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image:
      "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
    current_price: 46978,
    market_cap: 888084713113,
    market_cap_rank: 1,
    fully_diluted_valuation: 986540621536,
    total_volume: 27166733732,
    high_24h: 47466,
    low_24h: 45653,
    price_change_24h: -448.517772161074,
    price_change_percentage_24h: -0.94571,
    market_cap_change_24h: -6925208740.524048,
    market_cap_change_percentage_24h: -0.77376,
    circulating_supply: 18904218,
    total_supply: 21000000,
    max_supply: 21000000,
    ath: 69045,
    ath_change_percentage: -32.0311,
    ath_date: "2021-11-10T14:24:11.849Z",
    atl: 67.81,
    atl_change_percentage: 69107.58322,
    atl_date: "2013-07-06T00:00:00.000Z",
    roi: null,
    last_updated: "2021-12-18T16:31:02.628Z",
    price_change_percentage_24h_in_currency: -0.9457084615407927,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image:
      "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
    current_price: 3956.23,
    market_cap: 469967313961,
    market_cap_rank: 2,
    fully_diluted_valuation: null,
    total_volume: 22896047898,
    high_24h: 3998.6,
    low_24h: 3790.1,
    price_change_24h: 31.34,
    price_change_percentage_24h: 0.79852,
    market_cap_change_24h: 4376247843,
    market_cap_change_percentage_24h: 0.93993,
    circulating_supply: 118791776.124,
    total_supply: null,
    max_supply: null,
    ath: 4878.26,
    ath_change_percentage: -19.07897,
    ath_date: "2021-11-10T14:24:19.604Z",
    atl: 0.432979,
    atl_change_percentage: 911616.29321,
    atl_date: "2015-10-20T00:00:00.000Z",
    roi: {
      times: 111.85400578727416,
      currency: "btc",
      percentage: 11185.400578727416,
    },
    last_updated: "2021-12-18T16:30:24.123Z",
    price_change_percentage_24h_in_currency: 0.7985206175407733,
  },
  {
    id: "binancecoin",
    symbol: "bnb",
    name: "Binance Coin",
    image:
      "https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png?1547034615",
    current_price: 530.99,
    market_cap: 89278760378,
    market_cap_rank: 3,
    fully_diluted_valuation: 89278760378,
    total_volume: 601931681,
    high_24h: 536.2,
    low_24h: 519.35,
    price_change_24h: -1.431695982805,
    price_change_percentage_24h: -0.2689,
    market_cap_change_24h: -217891640.56773376,
    market_cap_change_percentage_24h: -0.24346,
    circulating_supply: 168137035.9,
    total_supply: 168137035.9,
    max_supply: 168137035.9,
    ath: 686.31,
    ath_change_percentage: -22.80102,
    ath_date: "2021-05-10T07:24:17.097Z",
    atl: 0.0398177,
    atl_change_percentage: 1330518.574,
    atl_date: "2017-10-19T00:00:00.000Z",
    roi: null,
    last_updated: "2021-12-18T16:30:40.065Z",
    price_change_percentage_24h_in_currency: -0.26890361163187976,
  },
  {
    id: "tether",
    symbol: "usdt",
    name: "Tether",
    image:
      "https://assets.coingecko.com/coins/images/325/large/Tether-logo.png?1598003707",
    current_price: 1,
    market_cap: 77439200796,
    market_cap_rank: 4,
    fully_diluted_valuation: null,
    total_volume: 62554588893,
    high_24h: 1.01,
    low_24h: 0.987325,
    price_change_24h: -0.011415856662,
    price_change_percentage_24h: -1.1271,
    market_cap_change_24h: -259872290.71488953,
    market_cap_change_percentage_24h: -0.33446,
    circulating_supply: 77328369536.52,
    total_supply: 77328369536.52,
    max_supply: null,
    ath: 1.32,
    ath_change_percentage: -24.41245,
    ath_date: "2018-07-24T00:00:00.000Z",
    atl: 0.572521,
    atl_change_percentage: 74.68274,
    atl_date: "2015-03-02T00:00:00.000Z",
    roi: null,
    last_updated: "2021-12-18T16:27:59.344Z",
    price_change_percentage_24h_in_currency: -1.1271033891153508,
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image:
      "https://assets.coingecko.com/coins/images/4128/large/Solana.jpg?1635329178",
    current_price: 182.14,
    market_cap: 55791855479,
    market_cap_rank: 5,
    fully_diluted_valuation: null,
    total_volume: 1864966986,
    high_24h: 182.76,
    low_24h: 171.62,
    price_change_24h: 1.27,
    price_change_percentage_24h: 0.70456,
    market_cap_change_24h: 1062110605,
    market_cap_change_percentage_24h: 1.94065,
    circulating_supply: 307978914.997809,
    total_supply: 508180963.57,
    max_supply: null,
    ath: 259.96,
    ath_change_percentage: -30.21122,
    ath_date: "2021-11-06T21:54:35.825Z",
    atl: 0.500801,
    atl_change_percentage: 36126.43086,
    atl_date: "2020-05-11T19:35:23.449Z",
    roi: null,
    last_updated: "2021-12-18T16:31:38.005Z",
    price_change_percentage_24h_in_currency: 0.704558493197451,
  },
  {
    id: "usd-coin",
    symbol: "usdc",
    name: "USD Coin",
    image:
      "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389",
    current_price: 0.999438,
    market_cap: 41947712099,
    market_cap_rank: 6,
    fully_diluted_valuation: null,
    total_volume: 3610141997,
    high_24h: 1.01,
    low_24h: 0.992322,
    price_change_24h: -0.008300533333,
    price_change_percentage_24h: -0.82368,
    market_cap_change_24h: -15466850.668174744,
    market_cap_change_percentage_24h: -0.03686,
    circulating_supply: 41988882706.8525,
    total_supply: 41974529053.5122,
    max_supply: null,
    ath: 1.17,
    ath_change_percentage: -14.81075,
    ath_date: "2019-05-08T00:40:28.300Z",
    atl: 0.891848,
    atl_change_percentage: 12.0168,
    atl_date: "2021-05-19T13:14:05.611Z",
    roi: null,
    last_updated: "2021-12-18T16:31:29.480Z",
    price_change_percentage_24h_in_currency: -0.823678944021661,
  },
  {
    id: "cardano",
    symbol: "ada",
    name: "Cardano",
    image:
      "https://assets.coingecko.com/coins/images/975/large/cardano.png?1547034860",
    current_price: 1.25,
    market_cap: 40061737912,
    market_cap_rank: 7,
    fully_diluted_valuation: 56220178462,
    total_volume: 1039172214,
    high_24h: 1.27,
    low_24h: 1.2,
    price_change_24h: -0.00949416665,
    price_change_percentage_24h: -0.7542,
    market_cap_change_24h: -35615245.100372314,
    market_cap_change_percentage_24h: -0.08882,
    circulating_supply: 32066390668.4135,
    total_supply: 45000000000,
    max_supply: 45000000000,
    ath: 3.09,
    ath_change_percentage: -59.59586,
    ath_date: "2021-09-02T06:00:10.474Z",
    atl: 0.01925275,
    atl_change_percentage: 6378.24434,
    atl_date: "2020-03-13T02:22:55.044Z",
    roi: null,
    last_updated: "2021-12-18T16:31:09.050Z",
    price_change_percentage_24h_in_currency: -0.754204745255466,
  },
];
// fetches currencies data for selected currencies ids
async function listPaginated({
  search = "",
  starred = [],
  order = "desc",
  range = "24h",
  ids = [],
}: MarketListRequestParams): Promise<CurrencyData[]> {
  const response = await Promise.resolve(paginatedData);

  let filteredResponse = response;

  if (order !== "desc") {
    filteredResponse = filteredResponse.sort(
      (x, y) => y.market_cap_rank - x.market_cap_rank
    );
  }

  if (search) {
    filteredResponse = filteredResponse.filter(matchSearch(search));
  }

  if (starred.length > 0) {
    filteredResponse = filteredResponse.filter((currency) =>
      starred.includes(currency.id)
    );
  }

  if (ids.length > 0) {
    filteredResponse = filteredResponse.filter((currency) =>
      ids.includes(currency.id)
    );
  }

  // @ts-expect-error issue in typing
  return filteredResponse.map((currency: any) => ({
    id: currency.id,
    name: currency.name,
    image: currency.image,
    internalCurrency: cryptoCurrenciesList.find(
      ({ ticker }) => ticker.toLowerCase() === currency.symbol
    ),
    marketcap: currency.market_cap,
    marketcapRank: currency.market_cap_rank,
    totalVolume: currency.total_volume,
    high24h: currency.high_24h,
    low24h: currency.low_24h,
    ticker: currency.symbol,
    price: currency.current_price,
    priceChangePercentage:
      range !== "24h"
        ? currency.price_change_percentage_24h_in_currency * 7
        : currency.price_change_percentage_24h_in_currency,
    marketCapChangePercentage24h: currency.market_cap_change_percentage_24h,
    circulatingSupply: currency.circulating_supply,
    totalSupply: currency.total_supply,
    maxSupply: currency.max_supply,
    ath: currency.ath,
    athDate: currency.ath_date,
    atl: currency.atl,
    atlDate: currency.atl_date,
    sparklineIn7d: null,
    chartData: [],
  }));
}

// Fetches list of supported counterCurrencies
async function supportedCounterCurrencies(): Promise<string[]> {
  return await Promise.resolve([
    "btc",
    "eth",
    "ltc",
    "bch",
    "bnb",
    "eos",
    "xrp",
    "xlm",
    "link",
    "dot",
    "yfi",
    "usd",
    "aed",
    "ars",
    "aud",
    "bdt",
    "bhd",
    "bmd",
    "brl",
    "cad",
    "chf",
    "clp",
    "cny",
    "czk",
    "dkk",
    "eur",
    "gbp",
    "hkd",
    "huf",
    "idr",
    "ils",
    "inr",
    "jpy",
    "krw",
    "kwd",
    "lkr",
    "mmk",
    "mxn",
    "myr",
    "ngn",
    "nok",
    "nzd",
    "php",
    "pkr",
    "pln",
    "rub",
    "sar",
    "sek",
    "sgd",
    "thb",
    "try",
    "twd",
    "uah",
    "vef",
    "vnd",
    "zar",
    "xdr",
    "xag",
    "xau",
    "bits",
    "sats",
  ]);
}

// Fetches list of supported currencies
async function currencyChartData(): Promise<{
  [range: string]: number[][];
}> {
  const response = await Promise.resolve({
    prices: [
      [1639760425566, 47035.7730170554],
      [1639764200520, 46779.28084436036],
      [1639767793752, 46899.81670459505],
      [1639771405996, 46806.89615030911],
      [1639774854719, 46372.35410149477],
      [1639778429112, 47091.66371795489],
      [1639782342710, 46507.965042542106],
      [1639785697940, 46328.6963654447],
      [1639789279103, 46415.52050647275],
      [1639793084532, 45826.54707719198],
      [1639796561743, 45886.69785964224],
      [1639800325023, 46535.85544547407],
      [1639803752264, 46630.66364205827],
      [1639807349369, 46796.65748955589],
      [1639810831681, 46404.12378055947],
      [1639814720824, 46429.86171498202],
      [1639818226026, 46208.467967110075],
      [1639821761024, 46794.55365462657],
      [1639825359138, 47337.122321658026],
      [1639829106656, 47070.8445217621],
      [1639832543681, 47113.48747087277],
      [1639836121826, 46857.76684001326],
      [1639839860258, 47145.895183572036],
      [1639843597758, 46876.27784614691],
      [1639845270000, 47035.775042793095],
    ],
  });

  return { "24h": response.prices };
}

export default {
  setSupportedCoinsList,
  listPaginated,
  supportedCounterCurrencies,
  currencyChartData,
};
