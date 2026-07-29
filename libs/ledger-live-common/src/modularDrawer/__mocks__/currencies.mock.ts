import { TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { getCryptoCurrencyById } from "../../currencies";

export const mockBtcCryptoCurrency = getCryptoCurrencyById("bitcoin");
export const mockEthCryptoCurrency = getCryptoCurrencyById("ethereum");
export const mockArbitrumCryptoCurrency = getCryptoCurrencyById("arbitrum");
export const mockBaseCryptoCurrency = getCryptoCurrencyById("base");
export const mockScrollCryptoCurrency = getCryptoCurrencyById("scroll");
export const mockInjectiveCryptoCurrency = getCryptoCurrencyById("injective");
export const mockBscCryptoCurrency = getCryptoCurrencyById("bsc");

export const arbitrumToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("arbitrum/erc20/arbitrum"),
  contractAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("arbitrum"),
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
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
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

export const maticEth: TokenCurrency = {
  type: "TokenCurrency" as const,
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/matic"),
  ledgerSignature: "",
  contractAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
  tokenType: "erc20" as const,
  name: "Matic",
  ticker: "MATIC",
  delisted: false,
  disableCountervalue: false,
  units: [
    {
      name: "Matic",
      code: "MATIC",
      magnitude: 18,
    },
  ],
};

export const maticBsc: TokenCurrency = {
  type: "TokenCurrency" as const,
  id: TokenCurrencyIdSchema.parse("bsc/bep20/matic_token"),
  ledgerSignature: "",
  contractAddress: "0xCC42724C6683B7E57334c4E856f4c9965ED682bD",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("bsc"),
  tokenType: "bep20" as const,
  name: "Matic Token",
  ticker: "MATIC",
  delisted: false,
  disableCountervalue: false,
  units: [
    {
      name: "Matic Token",
      code: "MATIC",
      magnitude: 18,
    },
  ],
};
export const findCryptoCurrencyById = (id: string) =>
  [mockBtcCryptoCurrency, mockEthCryptoCurrency, mockArbitrumCryptoCurrency].find(a => a.id === id);
export const getTokenOrCryptoCurrencyById = async (id: string) =>
  [
    mockBtcCryptoCurrency,
    mockEthCryptoCurrency,
    mockArbitrumCryptoCurrency,
    arbitrumToken,
    usdcToken,
  ].find(a => a.id === id);

export const mockCurrenciesByProvider = [
  {
    providerId: "ethereum",
    currenciesByNetwork: [mockEthCryptoCurrency],
  },
];

export const mockCurrencyIds = ["bitcoin", "ethereum", "arbitrum", "base"];
