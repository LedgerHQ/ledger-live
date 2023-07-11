import { groupedCurrenciesByProvider, searchByNameOrTicker, searchByProviderId } from "./helper";
import { MOCK } from "./mock";
import { MappedAsset } from "./type";

const MAPPED_ASSETS = MOCK as MappedAsset[];

const PROVIDER_RESULT = [
  [
    "tether",
    {
      currenciesByNetwork: [
        {
          $type: "Token",
          contract: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
          data: {
            img: "https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663",
            marketCapRank: 3,
          },
          ledgerId: "polygon/erc20/(pos)_tether_usd",
          name: "(PoS) Tether USD",
          network: "polygon",
          providerId: "tether",
          reason: null,
          status: "Ok",
          ticker: "USDT",
        },
        {
          $type: "Token",
          contract: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
          data: {
            img: "https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663",
            marketCapRank: 3,
          },
          ledgerId: "arbitrum/erc20/tether_usd",
          name: "Tether USD",
          network: "arbitrum",
          providerId: "tether",
          reason: null,
          status: "Ok",
          ticker: "USDT",
        },
        {
          $type: "Token",
          contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
          data: {
            img: "https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663",
            marketCapRank: 3,
          },
          ledgerId: "ethereum/erc20/usd_tether__erc20_",
          name: "Tether USD",
          network: "ethereum",
          providerId: "tether",
          reason: null,
          status: "Ok",
          ticker: "USDT",
        },
        {
          $type: "Token",
          contract: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
          data: {
            img: "https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663",
            marketCapRank: 3,
          },
          ledgerId: "optimism/erc20/tether_usd",
          name: "Tether USD",
          network: "optimism",
          providerId: "tether",
          reason: null,
          status: "Ok",
          ticker: "USDT",
        },
        {
          $type: "Token",
          contract: "0x66e428c3f67a68878562e79a0234c1f83c208770",
          data: {
            img: "https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663",
            marketCapRank: 3,
          },
          ledgerId: "cronos/erc20/tether_usd",
          name: "Tether USD",
          network: "cronos",
          providerId: "tether",
          reason: null,
          status: "Ok",
          ticker: "USDT",
        },
        {
          $type: "Token",
          contract: "0x55d398326f99059ff775485246999027b3197955",
          data: {
            img: "https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663",
            marketCapRank: 3,
          },
          ledgerId: "bsc/bep20/binance-peg_bsc-usd",
          name: "Binance-Peg BSC-USD",
          network: "bsc",
          providerId: "tether",
          reason: null,
          status: "Ok",
          ticker: "BSC-USD",
        },
      ],
      name: "Tether USD",
      names: {
        "(PoS) Tether USD/USDT": 1,
        "Binance-Peg BSC-USD/BSC-USD": 1,
        "Tether USD/USDT": 4,
      },
      providerId: "tether",
      ticker: "USDT",
    },
  ],
];

describe("Deposit logic", () => {
  test("searchByProviderId", () => {
    const result = searchByProviderId(MAPPED_ASSETS, "tether");

    expect(result).toEqual(MAPPED_ASSETS);
  });

  test("searchByNameOrTicker", () => {
    const result = searchByNameOrTicker(MAPPED_ASSETS, "usdt");
    expect(result.length).toBeGreaterThan(0);
  });

  test("groupedCurrenciesByProvider", () => {
    const result = groupedCurrenciesByProvider(MAPPED_ASSETS);
    expect(result).toEqual(PROVIDER_RESULT);
  });
});
