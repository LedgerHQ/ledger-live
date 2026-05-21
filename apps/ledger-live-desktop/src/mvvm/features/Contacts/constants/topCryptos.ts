/**
 * Static top-50 crypto list for the L1 dev panel's
 * `RegisterExternalAddress` form.
 *
 * Ordered roughly by market cap as of the L4 design pass. Treat as a
 * demo seed — NOT a live market feed and NOT used for any signing or
 * persistence logic. The Contacts `ContactEntry` schema in
 * `~/renderer/contacts/types.ts` is frozen at the DMK shape and has no
 * `ticker` / `coinId` field, so the user's selection in this form is
 * UI-only.
 *
 * `id` is a CoinGecko slug used as the Select value AND as the
 * `ledgerId` we pass to `@ledgerhq/crypto-icons`'s `CryptoIcon`.
 * The CryptoIcon resolver first tries the Ledger primary registry
 * (`crypto-icons.ledger.com/index.json`), then falls back to the
 * CoinGecko mapping service (`mapping-service.api.ledger.com/v1/
 * coingecko/mapped-assets`); the latter is keyed by CoinGecko slugs,
 * which is what these ids are — so picking a token here resolves to
 * the real glyph instead of the letter fallback.
 *
 * `ticker` is the symbol shown in the dropdown row.
 *
 * `networkIds` lists every network the crypto is deployed on. The
 * ids reference the `NETWORKS` registry in `constants/networks.ts`
 * and are consumed by `utils/getNetworksForCrypto.ts` to filter the
 * Network selector.
 *
 * TODO(contacts-L4.1): replace with the live market-cap feed once a
 * `ticker`/`coinId` field is added to ContactEntry via DMK
 * coordination. At that point this static list moves to a fallback.
 */

export type CryptoOption = {
  /** CoinGecko slug, doubles as the CryptoIcon `ledgerId`. */
  id: string;
  name: string;
  ticker: string;
  /** Network ids the crypto is deployed on — references `NETWORKS` keys. */
  networkIds: string[];
};

export const TOP_CRYPTOS: CryptoOption[] = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC", networkIds: ["bitcoin"] },
  { id: "ethereum", name: "Ethereum", ticker: "ETH", networkIds: ["ethereum", "arbitrum", "optimism", "base", "linea"] },
  { id: "tether", name: "Tether", ticker: "USDT", networkIds: ["ethereum", "bsc", "polygon", "arbitrum", "optimism", "avalanche", "tron", "solana"] },
  { id: "binancecoin", name: "BNB", ticker: "BNB", networkIds: ["bsc"] },
  { id: "solana", name: "Solana", ticker: "SOL", networkIds: ["solana"] },
  { id: "ripple", name: "XRP", ticker: "XRP", networkIds: ["ripple"] },
  { id: "usd-coin", name: "USD Coin", ticker: "USDC", networkIds: ["ethereum", "polygon", "base", "arbitrum", "optimism", "avalanche", "solana"] },
  { id: "dogecoin", name: "Dogecoin", ticker: "DOGE", networkIds: ["dogecoin"] },
  { id: "cardano", name: "Cardano", ticker: "ADA", networkIds: ["cardano"] },
  { id: "tron", name: "TRON", ticker: "TRX", networkIds: ["tron"] },
  { id: "avalanche-2", name: "Avalanche", ticker: "AVAX", networkIds: ["avalanche"] },
  { id: "shiba-inu", name: "Shiba Inu", ticker: "SHIB", networkIds: ["ethereum", "bsc"] },
  { id: "polkadot", name: "Polkadot", ticker: "DOT", networkIds: ["polkadot"] },
  { id: "chainlink", name: "Chainlink", ticker: "LINK", networkIds: ["ethereum", "bsc", "polygon", "arbitrum", "optimism", "avalanche", "base"] },
  { id: "matic-network", name: "Polygon", ticker: "POL", networkIds: ["polygon", "ethereum"] },
  { id: "bitcoin-cash", name: "Bitcoin Cash", ticker: "BCH", networkIds: ["bitcoin-cash"] },
  { id: "litecoin", name: "Litecoin", ticker: "LTC", networkIds: ["litecoin"] },
  { id: "the-open-network", name: "Toncoin", ticker: "TON", networkIds: ["ton"] },
  { id: "uniswap", name: "Uniswap", ticker: "UNI", networkIds: ["ethereum", "polygon", "arbitrum", "optimism", "base", "bsc"] },
  { id: "internet-computer", name: "Internet Computer", ticker: "ICP", networkIds: ["internet-computer"] },
  { id: "stellar", name: "Stellar", ticker: "XLM", networkIds: ["stellar"] },
  { id: "cosmos", name: "Cosmos", ticker: "ATOM", networkIds: ["cosmos"] },
  { id: "monero", name: "Monero", ticker: "XMR", networkIds: ["monero"] },
  { id: "ethereum-classic", name: "Ethereum Classic", ticker: "ETC", networkIds: ["ethereum-classic"] },
  { id: "filecoin", name: "Filecoin", ticker: "FIL", networkIds: ["filecoin"] },
  { id: "aptos", name: "Aptos", ticker: "APT", networkIds: ["aptos"] },
  { id: "near", name: "NEAR Protocol", ticker: "NEAR", networkIds: ["near"] },
  { id: "optimism", name: "Optimism", ticker: "OP", networkIds: ["optimism"] },
  { id: "arbitrum", name: "Arbitrum", ticker: "ARB", networkIds: ["arbitrum"] },
  { id: "crypto-com-chain", name: "Cronos", ticker: "CRO", networkIds: ["cronos", "ethereum"] },
  { id: "vechain", name: "VeChain", ticker: "VET", networkIds: ["vechain"] },
  { id: "render-token", name: "Render", ticker: "RNDR", networkIds: ["ethereum", "solana"] },
  { id: "hedera-hashgraph", name: "Hedera", ticker: "HBAR", networkIds: ["hedera"] },
  { id: "the-graph", name: "The Graph", ticker: "GRT", networkIds: ["ethereum", "arbitrum"] },
  { id: "algorand", name: "Algorand", ticker: "ALGO", networkIds: ["algorand"] },
  { id: "maker", name: "Maker", ticker: "MKR", networkIds: ["ethereum"] },
  { id: "aave", name: "Aave", ticker: "AAVE", networkIds: ["ethereum", "polygon", "avalanche", "arbitrum", "optimism", "base"] },
  { id: "fantom", name: "Fantom", ticker: "FTM", networkIds: ["fantom"] },
  { id: "tezos", name: "Tezos", ticker: "XTZ", networkIds: ["tezos"] },
  { id: "theta-token", name: "Theta Network", ticker: "THETA", networkIds: ["theta"] },
  { id: "blockstack", name: "Stacks", ticker: "STX", networkIds: ["stacks"] },
  { id: "flow", name: "Flow", ticker: "FLOW", networkIds: ["flow"] },
  { id: "quant-network", name: "Quant", ticker: "QNT", networkIds: ["ethereum"] },
  { id: "bittensor", name: "Bittensor", ticker: "TAO", networkIds: ["bittensor"] },
  { id: "sui", name: "Sui", ticker: "SUI", networkIds: ["sui"] },
  { id: "mantle", name: "Mantle", ticker: "MNT", networkIds: ["mantle", "ethereum"] },
  { id: "decentraland", name: "Decentraland", ticker: "MANA", networkIds: ["ethereum", "polygon"] },
  { id: "the-sandbox", name: "The Sandbox", ticker: "SAND", networkIds: ["ethereum", "polygon"] },
  { id: "axie-infinity", name: "Axie Infinity", ticker: "AXS", networkIds: ["ethereum"] },
  { id: "eos", name: "EOS", ticker: "EOS", networkIds: ["eos"] },
];
