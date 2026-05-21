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
};

export const TOP_CRYPTOS: CryptoOption[] = [
  { id: "bitcoin", name: "Bitcoin", ticker: "BTC", ledgerId: "bitcoin" },
  { id: "ethereum", name: "Ethereum", ticker: "ETH", ledgerId: "ethereum" },
  { id: "tether", name: "Tether", ticker: "USDT", ledgerId: "tether" },
  { id: "binancecoin", name: "BNB", ticker: "BNB", ledgerId: "bsc" },
  { id: "solana", name: "Solana", ticker: "SOL", ledgerId: "solana" },
  { id: "ripple", name: "XRP", ticker: "XRP", ledgerId: "ripple" },
  { id: "usd-coin", name: "USD Coin", ticker: "USDC", ledgerId: "usdc" },
  { id: "dogecoin", name: "Dogecoin", ticker: "DOGE", ledgerId: "dogecoin" },
  { id: "cardano", name: "Cardano", ticker: "ADA", ledgerId: "cardano" },
  { id: "tron", name: "TRON", ticker: "TRX", ledgerId: "tron" },
  { id: "avalanche", name: "Avalanche", ticker: "AVAX", ledgerId: "avalanche_c_chain" },
  { id: "shiba-inu", name: "Shiba Inu", ticker: "SHIB", ledgerId: "shiba-inu" },
  { id: "polkadot", name: "Polkadot", ticker: "DOT", ledgerId: "polkadot" },
  { id: "chainlink", name: "Chainlink", ticker: "LINK", ledgerId: "chainlink" },
  { id: "polygon", name: "Polygon", ticker: "POL", ledgerId: "polygon" },
  { id: "bitcoin-cash", name: "Bitcoin Cash", ticker: "BCH", ledgerId: "bitcoin_cash" },
  { id: "litecoin", name: "Litecoin", ticker: "LTC", ledgerId: "litecoin" },
  { id: "the-open-network", name: "Toncoin", ticker: "TON", ledgerId: "ton" },
  { id: "uniswap", name: "Uniswap", ticker: "UNI", ledgerId: "uniswap" },
  { id: "internet-computer", name: "Internet Computer", ticker: "ICP", ledgerId: "internet_computer" },
  { id: "stellar", name: "Stellar", ticker: "XLM", ledgerId: "stellar" },
  { id: "cosmos", name: "Cosmos", ticker: "ATOM", ledgerId: "cosmos" },
  { id: "monero", name: "Monero", ticker: "XMR", ledgerId: "monero" },
  { id: "ethereum-classic", name: "Ethereum Classic", ticker: "ETC", ledgerId: "ethereum_classic" },
  { id: "filecoin", name: "Filecoin", ticker: "FIL", ledgerId: "filecoin" },
  { id: "aptos", name: "Aptos", ticker: "APT", ledgerId: "aptos" },
  { id: "near", name: "NEAR Protocol", ticker: "NEAR", ledgerId: "near" },
  { id: "optimism", name: "Optimism", ticker: "OP", ledgerId: "optimism" },
  { id: "arbitrum", name: "Arbitrum", ticker: "ARB", ledgerId: "arbitrum" },
  { id: "cronos", name: "Cronos", ticker: "CRO", ledgerId: "cronos" },
  { id: "vechain", name: "VeChain", ticker: "VET", ledgerId: "vechain" },
  { id: "render-token", name: "Render", ticker: "RNDR", ledgerId: "render-token" },
  { id: "hedera-hashgraph", name: "Hedera", ticker: "HBAR", ledgerId: "hedera" },
  { id: "the-graph", name: "The Graph", ticker: "GRT", ledgerId: "the_graph" },
  { id: "algorand", name: "Algorand", ticker: "ALGO", ledgerId: "algorand" },
  { id: "maker", name: "Maker", ticker: "MKR", ledgerId: "maker" },
  { id: "aave", name: "Aave", ticker: "AAVE", ledgerId: "aave" },
  { id: "fantom", name: "Fantom", ticker: "FTM", ledgerId: "fantom" },
  { id: "tezos", name: "Tezos", ticker: "XTZ", ledgerId: "tezos" },
  { id: "theta-network", name: "Theta Network", ticker: "THETA", ledgerId: "theta" },
  { id: "stacks", name: "Stacks", ticker: "STX", ledgerId: "stacks" },
  { id: "flow", name: "Flow", ticker: "FLOW", ledgerId: "flow" },
  { id: "quant-network", name: "Quant", ticker: "QNT", ledgerId: "quant" },
  { id: "bittensor", name: "Bittensor", ticker: "TAO", ledgerId: "bittensor" },
  { id: "sui", name: "Sui", ticker: "SUI", ledgerId: "sui" },
  { id: "mantle", name: "Mantle", ticker: "MNT", ledgerId: "mantle" },
  { id: "decentraland", name: "Decentraland", ticker: "MANA", ledgerId: "decentraland" },
  { id: "the-sandbox", name: "The Sandbox", ticker: "SAND", ledgerId: "the_sandbox" },
  { id: "axie-infinity", name: "Axie Infinity", ticker: "AXS", ledgerId: "axie-infinity" },
  { id: "eos", name: "EOS", ticker: "EOS", ledgerId: "eos" },
];
