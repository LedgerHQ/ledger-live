import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const mockBtcCryptoCurrency = getCryptoCurrencyById("bitcoin");
export const mockEthCryptoCurrency = getCryptoCurrencyById("ethereum");
export const mockArbitrumCurrency = getCryptoCurrencyById("arbitrum");
export const mockBaseCurrency = getCryptoCurrencyById("base");
export const mockScrollCurrency = getCryptoCurrencyById("scroll");
export const injectiveCurrency = getCryptoCurrencyById("injective");

export const arbitrumToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "arbitrum/erc20/arbitrum",
  contractAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  parentCurrency: mockArbitrumCurrency,
  tokenType: "erc20",
  name: "Arbitrum",
  ticker: "ARB",
  units: [
    {
      name: "Arbitrum",
      code: "ARB",
      magnitude: 18,
    },
  ],
};
export const usdcToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrency: mockEthCryptoCurrency,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [
    {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
    },
  ],
};

export const findCryptoCurrencyById = (id: string) =>
  [mockBtcCryptoCurrency, mockEthCryptoCurrency, mockArbitrumCurrency].find(a => a.id === id);
export const getTokenOrCryptoCurrencyById = (id: string) =>
  [
    mockBtcCryptoCurrency,
    mockEthCryptoCurrency,
    mockArbitrumCurrency,
    arbitrumToken,
    usdcToken,
  ].find(a => a.id === id);

export const mockCurrenciesByProvider = [
  {
    providerId: "ethereum",
    currenciesByNetwork: [
      mockEthCryptoCurrency,
      mockArbitrumCurrency,
      mockBaseCurrency,
      mockScrollCurrency,
    ],
  },
];

export const mockCurrencyIds = ["bitcoin", "ethereum", "arbitrum", "base"];
