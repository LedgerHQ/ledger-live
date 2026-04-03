import { z } from "zod";
import { CurrencyIdSchema } from "@shared/schema-primitives";
import { UnitSchema } from "@domain/entity-unit";

/**
 * Blockchain explorer URL templates for a crypto currency.
 * Each field is a URL pattern where `$hash` or `$address` is replaced at runtime.
 */
export const ExplorerViewSchema = z.object({
  /** Transaction detail URL (e.g. `"https://blockstream.info/tx/$hash"`). */
  tx: z.string().optional(),
  /** Address detail URL (e.g. `"https://blockstream.info/address/$address"`). */
  address: z.string().optional(),
  /** Token detail URL. */
  token: z.string().optional(),
  /** Stake pool detail URL. */
  stakePool: z.string().optional(),
});

/** EVM chain metadata, inferred from {@link EthereumLikeInfoSchema}. */
export const EthereumLikeInfoSchema = z.object({
  /** EIP-155 chain id (e.g. `1` for Ethereum mainnet, `137` for Polygon). */
  chainId: z.number().int(),
});

/**
 * Bitcoin-like chain metadata used for address derivation and XPUB encoding.
 * Values correspond to the network's version bytes.
 */
export const BitcoinLikeInfoSchema = z.object({
  /** P2PKH version byte (e.g. `0` for Bitcoin mainnet). */
  P2PKH: z.number().int(),
  /** P2SH version byte (e.g. `5` for Bitcoin mainnet). */
  P2SH: z.number().int(),
  /** XPUB version bytes (e.g. `76066276` / `0x0488B21E` for Bitcoin mainnet). */
  XPUBVersion: z.number().int().optional(),
});

/**
 * Canonical Zod-first schema for a crypto currency entity.
 *
 * Written from scratch — does **not** import from `@ledgerhq/types-cryptoassets`.
 * TS types are derived via `z.infer<>`. The legacy types become adapters during
 * migration and will be deleted once all consumers are rewired.
 *
 * @see {@link CryptoCurrency} for the inferred TypeScript type.
 */
export const CryptoCurrencySchema = z.object({
  /** Discriminant for the currency union — always `"CryptoCurrency"`. */
  type: z.literal("CryptoCurrency"),
  /** Unique opaque id (e.g. `"bitcoin"`, `"ethereum"`). */
  id: CurrencyIdSchema,
  /** Human-readable display name (e.g. `"Bitcoin"`). */
  name: z.string(),
  /** Ticker used in exchanges and countervalue APIs (e.g. `"BTC"`). */
  ticker: z.string(),
  /**
   * Ordered list of display units. By convention `units[0]` is the default
   * (highest magnitude) unit. Must contain at least one entry.
   */
  units: z.array(UnitSchema).min(1),
  /** Optional currency symbol (e.g. `"Ƀ"`). Not all currencies have one. */
  symbol: z.string().optional(),
  /** When `true`, countervalue display is disabled (e.g. colliding tickers). */
  disableCountervalue: z.boolean().optional(),
  /** When `true`, the currency has been delisted and should not appear in new flows. */
  delisted: z.boolean().optional(),
  /** Search keywords (e.g. `["btc", "bitcoin"]`). */
  keywords: z.array(z.string()).optional(),
  /** Id of the currency this was forked from (e.g. `"bitcoin"` for Bitcoin Cash). */
  forkedFrom: z.string().optional(),
  /** App name as shown in Ledger Manager (e.g. `"Bitcoin"`). */
  managerAppName: z.string(),
  /**
   * SLIP-44 coin type. Not guaranteed unique across currencies
   * (e.g. testnets share the mainnet coin type).
   */
  coinType: z.number().int(),
  /** URI scheme used when formatting payment URIs (e.g. `"bitcoin"`). */
  scheme: z.string(),
  /** Brand color used in the UI (hex, e.g. `"#FBAE41"`). */
  color: z.string(),
  /** Coin family grouping (e.g. `"bitcoin"`, `"ethereum"`, `"evm"`). */
  family: z.string(),
  /** Approximate time between blocks in seconds. */
  blockAvgTime: z.number().int().optional(),
  /** `true` if the coin supports SegWit (P2SH-P2WPKH). */
  supportsSegwit: z.boolean().optional(),
  /** `true` if the coin supports native SegWit (bech32 / P2WPKH). */
  supportsNativeSegwit: z.boolean().optional(),
  /** If set, this is a testnet for the currency with this id. */
  isTestnetFor: z.string().optional(),
  /** Bitcoin-like chain metadata (version bytes). Present for `family: "bitcoin"`. */
  bitcoinLikeInfo: BitcoinLikeInfoSchema.optional(),
  /** EVM chain metadata. Present for `family: "ethereum"` and `family: "evm"`. */
  ethereumLikeInfo: EthereumLikeInfoSchema.optional(),
  /** One or more blockchain explorer URL templates. */
  explorerViews: z.array(ExplorerViewSchema),
  /** When set, the currency has been terminated; the link points to more info. */
  terminated: z.object({ link: z.string() }).optional(),
  /** Ticker displayed on the device (when different from `ticker`). */
  deviceTicker: z.string().optional(),
  /** Id used to connect to the Ledger explorer endpoint (when different from the currency id and ticker). */
  explorerId: z.string().optional(),
  /** Token standards supported by this chain (e.g. `["erc20"]`). */
  tokenTypes: z.array(z.string()).optional(),
});

/** A crypto currency entity, inferred from {@link CryptoCurrencySchema}. */
export type CryptoCurrency = z.infer<typeof CryptoCurrencySchema>;
/** Explorer view value object, inferred from {@link ExplorerViewSchema}. */
export type ExplorerView = z.infer<typeof ExplorerViewSchema>;
/** EVM chain info value object, inferred from {@link EthereumLikeInfoSchema}. */
export type EthereumLikeInfo = z.infer<typeof EthereumLikeInfoSchema>;
/** Bitcoin-like chain info value object, inferred from {@link BitcoinLikeInfoSchema}. */
export type BitcoinLikeInfo = z.infer<typeof BitcoinLikeInfoSchema>;
