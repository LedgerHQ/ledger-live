import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { setEnv } from "@ledgerhq/live-env";
import { MOCK_API, TEST_TOKEN } from "./fixtures";

// Must run before coin-cardano's constants.ts loads — it captures CARDANO_API_ENDPOINT /
// CARDANO_TESTNET_API_ENDPOINT at module-eval time, so setting them inside setup() is too late.
// Both point at MOCK_API: the mainnet (mock) scenarios hit CARDANO_API_ENDPOINT, the testnet (Yaci)
// scenario hits CARDANO_TESTNET_API_ENDPOINT; each scenario starts only its own MSW handler set.
setEnv("CARDANO_API_ENDPOINT", MOCK_API);
setEnv("CARDANO_TESTNET_API_ENDPOINT", MOCK_API);
// getValidators' epoch-params endpoint is a separate Ledger host; point it at the adapter too so the
// suite stays hermetic (served from a captured fixture).
setEnv("CARDANO_TESTNET_EPOCH_PARAMS_ENDPOINT", `${MOCK_API}/epoch-params`);

// The sync path resolves token sub-accounts through the crypto-assets store: getTokenFromAsset
// looks up by assetReference (contractAddress), and decodeTokenAccountId looks up by id. Only the
// single TEST_TOKEN resolves; everything else is undefined (native-only).
setupMockCryptoAssetsStore({
  findTokenByAddressInCurrency: async (address, currencyId) =>
    currencyId === "cardano" && address === TEST_TOKEN.contractAddress ? TEST_TOKEN : undefined,
  findTokenById: async id => (id === TEST_TOKEN.id ? TEST_TOKEN : undefined),
});
