/**
 * Central network registry shared by the Crypto picker and the Network
 * picker in the L1 dev panel's `RegisterExternalAddress` form.
 *
 * Each entry: `{ id, name, chainId? }`. EVM entries carry the EIP-155
 * `chainId` (the DMK Contacts feature only signs against EVM today, so
 * the form uses presence/absence of this field to gate submission).
 * Non-EVM entries omit `chainId` — they appear in the dropdown for UI
 * correctness ("Bitcoin → Bitcoin") but the Register button stays
 * disabled when one is selected.
 *
 * The list of `networkIds` on each `CryptoOption` (see
 * `topCryptos.ts`) references the keys of this registry.
 *
 * TODO(contacts-L4.1): replace with a live CAL feed
 * (`useGetTokensDataInfiniteQuery({ networkFamily })`) once a
 * ticker/coinId field lands in ContactEntry via DMK coordination. At
 * that point this static map moves to a fallback for offline / loading
 * states.
 */

export type NetworkOption = {
  /** Stable id. Used as the Select value and as the FK from
   *  `CryptoOption.networkIds`. */
  id: string;
  /** Display name shown in the dropdown. */
  name: string;
  /** EIP-155 chain id for EVM chains; omitted for non-EVM.
   *  The form requires this to be a number for `canSubmit` to be true. */
  chainId?: number;
};

export const NETWORKS: Record<string, NetworkOption> = {
  // ── EVM (the 8 chains the existing useEvmNetworks hook already
  // surfaces, kept in sync so the Ledger-account form keeps working).
  ethereum: { id: "ethereum", name: "Ethereum", chainId: 1 },
  bsc: { id: "bsc", name: "BNB Chain", chainId: 56 },
  polygon: { id: "polygon", name: "Polygon", chainId: 137 },
  arbitrum: { id: "arbitrum", name: "Arbitrum", chainId: 42161 },
  optimism: { id: "optimism", name: "Optimism", chainId: 10 },
  base: { id: "base", name: "Base", chainId: 8453 },
  avalanche: { id: "avalanche", name: "Avalanche", chainId: 43114 },
  linea: { id: "linea", name: "Linea", chainId: 59144 },
  // Useful extras the top-50 crypto list points at.
  cronos: { id: "cronos", name: "Cronos", chainId: 25 },
  fantom: { id: "fantom", name: "Fantom", chainId: 250 },

  // ── Non-EVM (demo-only — register-address submit stays disabled).
  bitcoin: { id: "bitcoin", name: "Bitcoin" },
  solana: { id: "solana", name: "Solana" },
  ripple: { id: "ripple", name: "XRP" },
  cardano: { id: "cardano", name: "Cardano" },
  tron: { id: "tron", name: "TRON" },
  cosmos: { id: "cosmos", name: "Cosmos" },
  dogecoin: { id: "dogecoin", name: "Dogecoin" },
  litecoin: { id: "litecoin", name: "Litecoin" },
  "bitcoin-cash": { id: "bitcoin-cash", name: "Bitcoin Cash" },
  ton: { id: "ton", name: "Toncoin" },
  "internet-computer": { id: "internet-computer", name: "Internet Computer" },
  stellar: { id: "stellar", name: "Stellar" },
  monero: { id: "monero", name: "Monero" },
  "ethereum-classic": { id: "ethereum-classic", name: "Ethereum Classic" },
  filecoin: { id: "filecoin", name: "Filecoin" },
  aptos: { id: "aptos", name: "Aptos" },
  near: { id: "near", name: "NEAR" },
  vechain: { id: "vechain", name: "VeChain" },
  hedera: { id: "hedera", name: "Hedera" },
  algorand: { id: "algorand", name: "Algorand" },
  tezos: { id: "tezos", name: "Tezos" },
  theta: { id: "theta", name: "Theta" },
  stacks: { id: "stacks", name: "Stacks" },
  flow: { id: "flow", name: "Flow" },
  quant: { id: "quant", name: "Quant" },
  bittensor: { id: "bittensor", name: "Bittensor" },
  sui: { id: "sui", name: "Sui" },
  mantle: { id: "mantle", name: "Mantle" },
  eos: { id: "eos", name: "EOS" },
};
