import type { FrameworkCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type {
  CryptoCurrencyId,
  TokenCurrency,
  TokenCurrencyId,
} from "@ledgerhq/ledger-wallet-framework/types";

/**
 * Stand-in for the ARC-20 entries of the not-yet-released CAL draft
 * https://github.com/LedgerHQ/crypto-assets/commit/c385249c9c98f1d1e4b115911ac0a44eac37af14
 *
 * Injected as a CAL store decorator at app bootstrap so every lookup sees them —
 * `findTokenByAddressInCurrency` for sync, `findTokenById` for account deserialization,
 * which would otherwise drop the token sub-accounts (and their operations) on reload.
 *
 * Delete this file and its bootstrap usages once CAL ships them.
 */
const ARC20_TOKENS = [
  { ticker: "ETH", name: "Ethereum", magnitude: 18 },
  { ticker: "SOL", name: "Solana", magnitude: 9 },
  { ticker: "USDT", name: "Tether USD", magnitude: 6 },
  { ticker: "WBTC", name: "Wrapped Bitcoin", magnitude: 8 },
];

const buildTokens = (parentCurrencyId: CryptoCurrencyId, prefix: string): TokenCurrency[] =>
  ARC20_TOKENS.map(({ ticker, name, magnitude }) => {
    const slug = ticker.toLowerCase();

    return {
      type: "TokenCurrency",
      id: `${parentCurrencyId}/arc20/${prefix}${slug}` as TokenCurrencyId,
      contractAddress: `${prefix}arc20_${slug}.aleo`,
      parentCurrencyId,
      tokenType: "arc20",
      name,
      ticker,
      units: [{ name: ticker, code: ticker, magnitude }],
    };
  });

const MOCKED_TOKENS = [
  ...buildTokens("aleo" as CryptoCurrencyId, ""),
  ...buildTokens("aleo_testnet" as CryptoCurrencyId, "test_"),
];

const MOCKED_TOKENS_BY_ID = new Map(MOCKED_TOKENS.map(token => [token.id, token]));

const MOCKED_TOKENS_BY_ADDRESS = new Map(
  MOCKED_TOKENS.map(token => [`${token.parentCurrencyId}:${token.contractAddress}`, token]),
);

/** Decorates a CAL store so ARC-20 lookups resolve locally, falling through for everything else. */
export function withMockedArc20Tokens(
  store: FrameworkCryptoAssetsStore,
): FrameworkCryptoAssetsStore {
  return {
    ...store,

    async findTokenById(tokenId) {
      return MOCKED_TOKENS_BY_ID.get(tokenId as TokenCurrencyId) ?? store.findTokenById(tokenId);
    },

    async findTokenByAddressInCurrency(address, currencyId, tokenIdentifier) {
      return (
        MOCKED_TOKENS_BY_ADDRESS.get(`${currencyId}:${address}`) ??
        store.findTokenByAddressInCurrency(address, currencyId, tokenIdentifier)
      );
    },
  };
}
