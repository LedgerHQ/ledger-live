import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { setZcashShieldedEnabled } from "../bridge/zcashRouting";
import { clearBridgeCache } from "../bridge/impl";
import { coinModuleLoaders } from "../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../coin-modules/registry";
import { registerAllCoins } from "../coin-modules/load-all-coins";
import { toAccountRaw, fromAccountRaw } from "./serialization";
import { setWalletAPIVersion } from "../wallet-api/version";
import { WALLET_API_VERSION } from "../wallet-api/constants";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import solanaSplTokenData from "../__fixtures__/solana-spl-epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v.json";
import { TokenCurrency } from "@domain/entity-currency-token";

setWalletAPIVersion(WALLET_API_VERSION);

const Solana = getCryptoCurrencyById("solana");

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const USDC = solanaSplTokenData as TokenCurrency;

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStore({
  findTokenById: async (id: string) => {
    if (id === "solana/spl/epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v") {
      return USDC;
    }

    return undefined;
  },
  findTokenByAddressInCurrency: async (_: string, __: string) => undefined,
  getTokensSyncHash: async (_: string) => "0",
} as unknown as CryptoAssetsStore);

describe("serialization", () => {
  test("TokenAccount extra fields should be serialized/deserialized", async () => {
    const acc: any = genAccount("mocked-account-1", { currency: Solana });
    const tokenAcc: any = genTokenAccount(1, acc, USDC);
    tokenAcc.state = "initialized";
    acc.subAccounts = [tokenAcc];

    const accRaw: any = await toAccountRaw(acc);
    expect(accRaw.subAccounts?.[0]?.state).toBe("initialized");

    const deserializedAcc: any = await fromAccountRaw(accRaw);
    expect(deserializedAcc.subAccounts?.[0]?.state).toBe("initialized");
  });

  test("account readiness should be serialized/deserialized", async () => {
    const acc: any = genAccount("mocked-account-readiness", { currency: Solana });
    acc.readiness = { ready: false, reason: "unrevealed" };

    const accRaw: any = await toAccountRaw(acc);
    expect(accRaw.readiness).toEqual({ ready: false, reason: "unrevealed" });

    const deserializedAcc: any = await fromAccountRaw(accRaw);
    expect(deserializedAcc.readiness).toEqual({ ready: false, reason: "unrevealed" });
  });

  test("account without readiness stays undefined through serialization", async () => {
    const acc: any = genAccount("mocked-account-no-readiness", { currency: Solana });
    delete acc.readiness;

    const accRaw: any = await toAccountRaw(acc);
    expect(accRaw.readiness).toBeUndefined();

    const deserializedAcc: any = await fromAccountRaw(accRaw);
    expect(deserializedAcc.readiness).toBeUndefined();
  });

  // Zcash declares `family: "bitcoin"`, and coin-bitcoin's hooks know nothing about the
  // shielded `privateInfo`. Both directions therefore have to go through coin-zcash even
  // with the shielded flag off: accounts are deserialized at startup, before the host app
  // mirrors the flag, so a flag-gated router would drop the viewing key on every boot --
  // and re-serializing through coin-bitcoin would drop it again on the next save.
  describe("zcash with the shielded flag off", () => {
    const zcashAccountRaw = (): any => ({
      id: "mock:1:zcash:zcash_1:",
      seedIdentifier: "mock",
      derivationMode: "",
      index: 0,
      freshAddress: "t1transparent",
      freshAddressPath: "44'/133'/0'/0/0",
      name: "Zcash 1",
      balance: "7000000",
      spendableBalance: "7000000",
      blockHeight: 3450000,
      currencyId: "zcash",
      unitMagnitude: 8,
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      lastSyncDate: "",
      creationDate: new Date().toISOString(),
      bitcoinResources: {
        utxos: [["aaaa", 0, 3449990, "t1transparent", "5000000", 0, 0]],
      },
      privateInfo: {
        saplingBalance: "0",
        orchardBalance: "0",
        ironwoodBalance: "2000000",
        syncState: "complete",
        progress: 1,
        estimatedTimeRemaining: { hours: 0, minutes: 0 },
        ufvk: "uview1test",
        birthday: null,
        shieldedAddress: "u1shielded",
        lastSyncTimestamp: 1700000000000,
        lastProcessedBlock: 3450000,
        transactions: [],
      },
    });

    beforeEach(() => {
      setZcashShieldedEnabled(false);
    });

    test("privateInfo survives deserialization", async () => {
      const deserializedAcc: any = await fromAccountRaw(zcashAccountRaw());

      expect(deserializedAcc.privateInfo?.ufvk).toBe("uview1test");
      expect(deserializedAcc.bitcoinResources?.utxos).toHaveLength(1);
    });

    // The save side of the same trap: the mock account id routes `toAccountRaw` to a mock
    // bridge, and coin-bitcoin's declares no assign hooks at all -- so a flag-gated router
    // here would drop `privateInfo` *and* the transparent `bitcoinResources` on persist,
    // silently undoing what deserialization just restored.
    test("privateInfo and bitcoinResources survive a full round-trip", async () => {
      const initialRaw = zcashAccountRaw();

      const account: any = await fromAccountRaw(initialRaw);
      const reserializedRaw: any = await toAccountRaw(account);

      expect(reserializedRaw.privateInfo).toEqual({
        ...initialRaw.privateInfo,
        // The fixture omits `lastSyncError`, as an account persisted before that field
        // existed does; reading one back fills it with `null`, so the round-trip writes
        // it out. Everything else has to come back byte-identical.
        lastSyncError: null,
      });
      expect(reserializedRaw.bitcoinResources).toEqual(initialRaw.bitcoinResources);
    });

    // wallet-cli registers bitcoin, evm and solana only, so there is no "zcash" family to
    // route to; the account has to keep coin-bitcoin's adapter rather than fail resolution.
    describe("on a host without the standalone zcash module", () => {
      beforeEach(() => {
        resetCoinModulesForTests();
        registerCoinModules(coinModuleLoaders.filter(l => l.family === "bitcoin"));
        clearBridgeCache();
      });

      afterEach(() => {
        resetCoinModulesForTests();
        registerAllCoins();
        clearBridgeCache();
      });

      test("deserializes through the bitcoin family instead of throwing", async () => {
        const account: any = await fromAccountRaw(zcashAccountRaw());

        expect(account.currency.id).toBe("zcash");
      });
    });
  });
});
