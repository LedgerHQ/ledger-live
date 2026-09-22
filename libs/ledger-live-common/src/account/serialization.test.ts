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

  // getAccountBridge() rejected on an unsupported account before the bridge was resolved via
  // resolveSerializationFamily instead; toAccountRaw re-runs that same check up front. An
  // unregistered family isn't a discriminating case for this: getAccountBridgeByFamily ->
  // loadSetupForFamily -> the registry's own getLoader() throws the identical "No coin module
  // registered" message independently, so that scenario passes with or without this guard. The
  // guard's only reachable-nowhere-else branch is an unsupported derivation mode on an
  // otherwise-registered family, so that's what has to be under test.
  test("toAccountRaw rejects on an unsupported derivation mode even though the family is registered", async () => {
    const acc: any = genAccount("mocked-account-bad-derivation-mode", { currency: Solana });
    acc.derivationMode = "not-a-real-derivation-mode";

    await expect(toAccountRaw(acc)).rejects.toThrow(/derivation not supported/);
  });

  // Zcash declares `family: "bitcoin"`, and coin-bitcoin's real bridge already round-trips
  // the shielded `privateInfo` unconditionally via its Zcash chain-adapter, flag-independent
  // by design (accounts are deserialized at startup, before the host app mirrors the flag, so
  // a flag-gated router would drop the viewing key on every boot regardless). Only a `mock:`
  // account id needs special routing: coin-bitcoin's *mock* bridge declares no assign hooks at
  // all, so a mock id has to go through the standalone zcash module's mock bridge instead, or
  // both `privateInfo` and `bitcoinResources` are dropped.
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
        shieldedAddress:
          "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9",
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

    // wallet-cli registers bitcoin, evm and solana only, so there is no "zcash" family
    // registered here.
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

      // A real (non-mock) account id already takes the bitcoin family unconditionally --
      // resolveSerializationFamily only ever reads isCoinModuleRegistered for a mock id -- so
      // this doesn't exercise that guard, only the (already-correct) real-id path: it shows
      // coin-bitcoin's real chain-adapter preserves both fields on a reduced-registry host.
      test("a real account id deserializes through the bitcoin family with privateInfo and bitcoinResources intact", async () => {
        const raw = { ...zcashAccountRaw(), id: "js:2:zcash:xpub6zcashtest:" };

        const account: any = await fromAccountRaw(raw);

        expect(account.currency.id).toBe("zcash");
        expect(account.privateInfo?.ufvk).toBe("uview1test");
        expect(account.bitcoinResources?.utxos).toHaveLength(1);
      });

      // This is the guard `isCoinModuleRegistered("zcash")` actually covers: a *mock* id has
      // nowhere to fall but coin-bitcoin's mock bridge, which declares no assign hooks at all.
      // The fallback keeps resolution from throwing `CurrencyNotSupported` -- it does not
      // preserve the shielded state, unlike the real-id case above.
      test("a mock account id deserializes through the bitcoin family without throwing, though shielded data is lost", async () => {
        const account: any = await fromAccountRaw(zcashAccountRaw());

        expect(account.currency.id).toBe("zcash");
        expect(account.privateInfo).toBeUndefined();
        expect(account.bitcoinResources).toBeUndefined();
      });
    });
  });
});
