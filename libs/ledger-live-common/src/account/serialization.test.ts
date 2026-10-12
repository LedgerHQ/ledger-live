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

  // getAccountBridge() rejects on an unsupported account before the bridge is resolved;
  // toAccountRaw resolves it by family, so it re-runs that same check up front. An
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

  // Zcash accounts belong to the `zcash` family, served by coin-zcash whatever the shielded
  // flag says: the flag only switches coin-zcash's engine, not where accounts are persisted.
  describe("zcash", () => {
    const zcashAccountRaw = (id = "mock:1:zcash:zcash_1:"): any => ({
      id,
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

    afterEach(() => setZcashShieldedEnabled(false));

    // Accounts are deserialized at startup, before the host app mirrors the flag: whatever its
    // value, the shielded state and the transparent coins come back.
    test.each([
      ["a mock", "mock:1:zcash:zcash_1:", false],
      ["a mock", "mock:1:zcash:zcash_1:", true],
      ["a real", "js:2:zcash:xpub6zcashtest:", false],
      ["a real", "js:2:zcash:xpub6zcashtest:", true],
    ])(
      "%s account id round-trips privateInfo and bitcoinResources (shielded flag %s)",
      async (_kind, id, shielded) => {
        setZcashShieldedEnabled(shielded);
        const initialRaw = zcashAccountRaw(id);

        const account: any = await fromAccountRaw(initialRaw);
        expect(account.privateInfo?.ufvk).toBe("uview1test");
        expect(account.bitcoinResources?.utxos).toHaveLength(1);

        const reserializedRaw: any = await toAccountRaw(account);
        expect(reserializedRaw.privateInfo).toEqual({
          ...initialRaw.privateInfo,
          // The fixture omits `lastSyncError`, as an account persisted before that field
          // existed does; reading one back fills it with `null`, so the round-trip writes
          // it out. Everything else has to come back byte-identical.
          lastSyncError: null,
        });
        expect(reserializedRaw.bitcoinResources).toEqual(initialRaw.bitcoinResources);
      },
    );

    // wallet-cli registers bitcoin, evm and solana only: a Zcash account has no family to
    // load there, and says so rather than loading as something else.
    describe("on a host without the zcash module", () => {
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

      test("refuses to deserialize a zcash account", async () => {
        await expect(fromAccountRaw(zcashAccountRaw("js:2:zcash:xpub6zcashtest:"))).rejects.toThrow(
          /zcash/,
        );
      });
    });
  });
});
