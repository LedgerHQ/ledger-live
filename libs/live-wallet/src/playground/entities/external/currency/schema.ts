import { z } from "zod";

export const LedgerExplorerIdSchema = z.enum([
  "btc",
  "btc_testnet",
  "bch",
  "btg",
  "club",
  "dash",
  "dcr",
  "dgb",
  "doge",
  "hsr",
  "kmd",
  "ltc",
  "posw",
  "qtum",
  "strat",
  "zec",
  "zen",
  "avax",
  "eth",
  "eth_sepolia",
  "eth_holesky",
  "eth_hoodi",
  "etc",
  "matic",
  "bnb",
]);

export const UnitSchema = z.object({
  name: z.string(),
  code: z.string(),
  magnitude: z.number(),
  showAllDigits: z.boolean().optional(),
  prefixCode: z.boolean().optional(),
});

export const ExplorerViewSchema = z.object({
  tx: z.string().optional(),
  address: z.string().optional(),
  token: z.string().optional(),
  stakePool: z.string().optional(),
});

export const EthereumLikeInfoSchema = z.object({
  chainId: z.number(),
});

export const BitcoinLikeInfoSchema = z.object({
  P2PKH: z.number(),
  P2SH: z.number(),
  XPUBVersion: z.number().optional(),
});

export const CurrencyCommonSchema = z.object({
  name: z.string(),
  ticker: z.string(),
  units: z.array(UnitSchema),
  symbol: z.string().optional(),
  disableCountervalue: z.boolean().optional(),
  delisted: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
});

export const CryptoCurrencySchema = CurrencyCommonSchema.extend({
  type: z.literal("CryptoCurrency"),
  id: z.string(),
  forkedFrom: z.string().optional(),
  managerAppName: z.string(),
  coinType: z.number(),
  scheme: z.string(),
  color: z.string(),
  family: z.string(),
  blockAvgTime: z.number().optional(),
  supportsSegwit: z.boolean().optional(),
  supportsNativeSegwit: z.boolean().optional(),
  isTestnetFor: z.string().optional(),
  bitcoinLikeInfo: BitcoinLikeInfoSchema.optional(),
  ethereumLikeInfo: EthereumLikeInfoSchema.optional(),
  explorerViews: z.array(ExplorerViewSchema),
  terminated: z
    .object({
      link: z.string(),
    })
    .optional(),
  deviceTicker: z.string().optional(),
  explorerId: LedgerExplorerIdSchema.optional(),
  tokenTypes: z.array(z.string()).optional(),
});

export const TokenCurrencySchema = CurrencyCommonSchema.extend({
  type: z.literal("TokenCurrency"),
  id: z.string(),
  ledgerSignature: z.string().optional(),
  contractAddress: z.string(),
  parentCurrency: CryptoCurrencySchema,
  tokenType: z.string(),
});

export const CryptoOrTokenCurrencySchema = z.union([CryptoCurrencySchema, TokenCurrencySchema]);
