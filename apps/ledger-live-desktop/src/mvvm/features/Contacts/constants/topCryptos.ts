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
 * `id` is a stable lowercase slug we use as the Select value.
 * `ticker` is the symbol shown in the dropdown row.
 * `ledgerId` is the input to `@ledgerhq/crypto-icons`'s `CryptoIcon`
 * (matches live-common currency ids where available; falls back to the
 * lowercase ticker otherwise).
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
  id: string;
  name: string;
  ticker: string;
  ledgerId: string;
  /** Network ids the crypto is deployed on — references `NETWORKS` keys. */
  networkIds: string[];
};

export const TOP_CRYPTOS: CryptoOption[] = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC", ledgerId: "bitcoin", networkIds: ["bitcoin"] },
  { id: "ethereum", name: "Ethereum", ticker: "ETH", ledgerId: "ethereum", networkIds: ["ethereum", "arbitrum", "optimism", "base", "linea"] },
  { id: "tether", name: "Tether", ticker: "USDT", ledgerId: "tether", networkIds: ["ethereum", "bsc", "polygon", "arbitrum", "optimism", "avalanche", "tron", "solana"] },
  { id: "binancecoin", name: "BNB", ticker: "BNB", ledgerId: "bsc", networkIds: ["bsc"] },
  { id: "solana", name: "Solana", ticker: "SOL", ledgerId: "solana", networkIds: ["solana"] },
  { id: "ripple", name: "XRP", ticker: "XRP", ledgerId: "ripple", networkIds: ["ripple"] },
  { id: "usd-coin", name: "USD Coin", ticker: "USDC", ledgerId: "usdc", networkIds: ["ethereum", "polygon", "base", "arbitrum", "optimism", "avalanche", "solana"] },
  { id: "dogecoin", name: "Dogecoin", ticker: "DOGE", ledgerId: "dogecoin", networkIds: ["dogecoin"] },
  { id: "cardano", name: "Cardano", ticker: "ADA", ledgerId: "cardano", networkIds: ["cardano"] },
  { id: "tron", name: "TRON", ticker: "TRX", ledgerId: "tron", networkIds: ["tron"] },
  { id: "avalanche", name: "Avalanche", ticker: "AVAX", ledgerId: "avalanche_c_chain", networkIds: ["avalanche"] },
  { id: "shiba-inu", name: "Shiba Inu", ticker: "SHIB", ledgerId: "shiba-inu", networkIds: ["ethereum", "bsc"] },
  { id: "polkadot", name: "Polkadot", ticker: "DOT", ledgerId: "polkadot", networkIds: ["polkadot"] },
  { id: "chainlink", name: "Chainlink", ticker: "LINK", ledgerId: "chainlink", networkIds: ["ethereum", "bsc", "polygon", "arbitrum", "optimism", "avalanche", "base"] },
  { id: "polygon", name: "Polygon", ticker: "POL", ledgerId: "polygon", networkIds: ["polygon", "ethereum"] },
  { id: "bitcoin-cash", name: "Bitcoin Cash", ticker: "BCH", ledgerId: "bitcoin_cash", networkIds: ["bitcoin-cash"] },
  { id: "litecoin", name: "Litecoin", ticker: "LTC", ledgerId: "litecoin", networkIds: ["litecoin"] },
  { id: "the-open-network", name: "Toncoin", ticker: "TON", ledgerId: "ton", networkIds: ["ton"] },
  { id: "uniswap", name: "Uniswap", ticker: "UNI", ledgerId: "uniswap", networkIds: ["ethereum", "polygon", "arbitrum", "optimism", "base", "bsc"] },
  { id: "internet-computer", name: "Internet Computer", ticker: "ICP", ledgerId: "internet_computer", networkIds: ["internet-computer"] },
  { id: "stellar", name: "Stellar", ticker: "XLM", ledgerId: "stellar", networkIds: ["stellar"] },
  { id: "cosmos", name: "Cosmos", ticker: "ATOM", ledgerId: "cosmos", networkIds: ["cosmos"] },
  { id: "monero", name: "Monero", ticker: "XMR", ledgerId: "monero", networkIds: ["monero"] },
  { id: "ethereum-classic", name: "Ethereum Classic", ticker: "ETC", ledgerId: "ethereum_classic", networkIds: ["ethereum-classic"] },
  { id: "filecoin", name: "Filecoin", ticker: "FIL", ledgerId: "filecoin", networkIds: ["filecoin"] },
  { id: "aptos", name: "Aptos", ticker: "APT", ledgerId: "aptos", networkIds: ["aptos"] },
  { id: "near", name: "NEAR Protocol", ticker: "NEAR", ledgerId: "near", networkIds: ["near"] },
  { id: "optimism", name: "Optimism", ticker: "OP", ledgerId: "optimism", networkIds: ["optimism"] },
  { id: "arbitrum", name: "Arbitrum", ticker: "ARB", ledgerId: "arbitrum", networkIds: ["arbitrum"] },
  { id: "cronos", name: "Cronos", ticker: "CRO", ledgerId: "cronos", networkIds: ["cronos", "ethereum"] },
  { id: "vechain", name: "VeChain", ticker: "VET", ledgerId: "vechain", networkIds: ["vechain"] },
  { id: "render-token", name: "Render", ticker: "RNDR", ledgerId: "render-token", networkIds: ["ethereum", "solana"] },
  { id: "hedera-hashgraph", name: "Hedera", ticker: "HBAR", ledgerId: "hedera", networkIds: ["hedera"] },
  { id: "the-graph", name: "The Graph", ticker: "GRT", ledgerId: "the_graph", networkIds: ["ethereum", "arbitrum"] },
  { id: "algorand", name: "Algorand", ticker: "ALGO", ledgerId: "algorand", networkIds: ["algorand"] },
  { id: "maker", name: "Maker", ticker: "MKR", ledgerId: "maker", networkIds: ["ethereum"] },
  { id: "aave", name: "Aave", ticker: "AAVE", ledgerId: "aave", networkIds: ["ethereum", "polygon", "avalanche", "arbitrum", "optimism", "base"] },
  { id: "fantom", name: "Fantom", ticker: "FTM", ledgerId: "fantom", networkIds: ["fantom"] },
  { id: "tezos", name: "Tezos", ticker: "XTZ", ledgerId: "tezos", networkIds: ["tezos"] },
  { id: "theta-network", name: "Theta Network", ticker: "THETA", ledgerId: "theta", networkIds: ["theta"] },
  { id: "stacks", name: "Stacks", ticker: "STX", ledgerId: "stacks", networkIds: ["stacks"] },
  { id: "flow", name: "Flow", ticker: "FLOW", ledgerId: "flow", networkIds: ["flow"] },
  { id: "quant-network", name: "Quant", ticker: "QNT", ledgerId: "quant", networkIds: ["ethereum"] },
  { id: "bittensor", name: "Bittensor", ticker: "TAO", ledgerId: "bittensor", networkIds: ["bittensor"] },
  { id: "sui", name: "Sui", ticker: "SUI", ledgerId: "sui", networkIds: ["sui"] },
  { id: "mantle", name: "Mantle", ticker: "MNT", ledgerId: "mantle", networkIds: ["mantle", "ethereum"] },
  { id: "decentraland", name: "Decentraland", ticker: "MANA", ledgerId: "decentraland", networkIds: ["ethereum", "polygon"] },
  { id: "the-sandbox", name: "The Sandbox", ticker: "SAND", ledgerId: "the_sandbox", networkIds: ["ethereum", "polygon"] },
  { id: "axie-infinity", name: "Axie Infinity", ticker: "AXS", ledgerId: "axie-infinity", networkIds: ["ethereum"] },
  { id: "eos", name: "EOS", ticker: "EOS", ledgerId: "eos", networkIds: ["eos"] },
];
