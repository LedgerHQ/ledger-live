import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";

export const STACKS = getCryptoCurrencyById("stacks");

// Clarinet's own well-known devnet dev accounts, verified against `clarinet new`'s generated
// `settings/Devnet.toml` (`clarinet-cli/src/generate/project.rs` in
// https://github.com/stx-labs/clarinet) — public, deterministic, devnet-only keys, not a secret
// specific to this package. See `settings/Devnet.toml` for the matching mnemonics/balances.
//
// The deployer publishes both contracts (`Clarinet.toml` sets no per-contract `deployer` override)
// and pays for the staking scenario's signer-manager setup, but is never a scenario's sender. It
// must not send anything before `signer-manager-stub` is deployed: Clarinet signs its deployment
// plan up front with pre-assigned deployer nonces, so an earlier deployer transaction takes the
// stub's nonce and the stub silently never deploys. That is why the send scenarios' test tokens are
// minted straight to their senders by `contracts/sip-010-test-token.clar`, not transferred.
export const DEPLOYER_PRIVATE_KEY =
  "753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601";
export const DEPLOYER_ADDRESS = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
export const RECIPIENT_PRIVATE_KEY =
  "530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101";

// One sender per scenario. All scenarios share one devnet (`scenarii.test.ts`), so a scenario that
// reused another's account would start on its leftover history and balances -- e.g. the send
// scenario's "send max" draining it. Separate accounts keep the chain shared and each account's
// state fresh. These are Clarinet's `wallet_4`..`wallet_6`: unlike `wallet_1`..`wallet_3`, they
// are not in `Devnet.toml`'s `pox_stacking_orders`, so none of their STX is locked.
export const SENDER_PRIVATE_KEYS = {
  legacy: "f9d7206a47f14d2870c163ebab4bf3e70d18f5d14ce1031f3902fbbc894fe4c701", // wallet_4
  "generic-adapter": "3eccc5dac8056590432db6a35d52b9896876a3d5cbdea53b72400bc9c2099fe801", // wallet_5
} as const;
export const STAKER_PRIVATE_KEY =
  "7036b29cb5e235e5fd9b09ae3e8eec4404e44906814d5d01cbca968a60ed4bfb01"; // wallet_6

export const TOKEN_CONTRACT_NAME = "sip-010-test-token";
const TOKEN_ASSET_NAME = "test-token";

/**
 * The SIP-010 test token deployed when the devnet boots by `contracts/sip-010-test-token.clar`
 * (`Clarinet.toml`'s `[contracts.sip-010-test-token]` entry, deployed by the manifest's own
 * `deployer` account since no per-contract `deployer` override is set there). Composite id format
 * ("ADDRESS.CONTRACT::ASSET") verified against `parseSip010AssetReference`-equivalent logic in
 * `coin-stacks/bridge/utils/transactions.ts`'s `getTokenContractDetails`.
 */
export const TEST_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("stacks/sip010/coin-tester-test-token"),
  contractAddress: `${DEPLOYER_ADDRESS}.${TOKEN_CONTRACT_NAME}::${TOKEN_ASSET_NAME}`,
  parentCurrencyId: CryptoCurrencyIdSchema.parse("stacks"),
  tokenType: "sip010",
  name: "Coin Tester Token",
  ticker: "CTT",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "Coin Tester Token", code: "CTT", magnitude: 6 }],
};

/**
 * Registers the test token in the crypto assets store so `coin-stacks`'s synchronization layer
 * (`createTokenAccount`, which calls `findTokenByAddressInCurrency(tokenId, "stacks")`) can
 * resolve it into a subAccount.
 */
export function registerTestTokenInMockStore(): void {
  setCryptoAssetsStore({
    findTokenById: async id => (id === TEST_TOKEN.id ? TEST_TOKEN : undefined),
    findTokenByAddressInCurrency: async (address, currencyId) =>
      currencyId === STACKS.id && address.toLowerCase() === TEST_TOKEN.contractAddress.toLowerCase()
        ? TEST_TOKEN
        : undefined,
    getTokensSyncHash: async () => "",
  });
}

/**
 * `coin-stacks`'s `getAccountShape` (`bridge/synchronization.ts`) treats `account.xpub` as the raw
 * public key hex, not the address — it's what gets fed into `getAddressFromPublicKey` on every
 * sync and into `createTransaction(..., xpub, ...)` as the transaction's `publicKey`. So, unlike
 * VeChain/NEAR's single-address `makeAccount(address)`, this one keys the account id on the public
 * key, not on the address itself.
 */
export function makeAccount(publicKeyHex: string, address: string): Account {
  const id = `js:2:${STACKS.id}:${publicKeyHex}:`;
  const { derivationMode } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: STACKS });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, STACKS, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    xpub: publicKeyHex,
    subAccounts: [],
    seedIdentifier: publicKeyHex,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: STACKS,
    index,
    nfts: [],
    freshAddress: address,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };
}
