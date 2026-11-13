import { createBridges } from "@ledgerhq/coin-zcash";
import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";
import type { SignerContext } from "@ledgerhq/coin-zcash/types/signer";
import type { ZcashCoinConfig } from "@ledgerhq/coin-zcash";
import resolver from "@ledgerhq/coin-zcash/signer/getAddress";
import { orchardAddressFromUfvk } from "@ledgerhq/zcash-utils";
import { setZcashShieldedEnabled } from "@ledgerhq/live-common/bridge/zcashRouting";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { SYNC_TYPE_SHIELDED, SYNC_TYPE_TRANSPARENT } from "@ledgerhq/types-live";
import { EXPLORER_ORIGIN } from "./indexer";
import { makeAccount } from "./fixtures";
import { ZAINO_GRPC_URL } from "./regtestNode";
import { buildSigner } from "./signer";

/**
 * The account, bridges and local signer every regtest test in this package
 * drives, wired against the local zaino and explorer. Nothing here touches
 * Docker: the caller spawns the node once it has `address`.
 */
export async function createBridgeSetup() {
  const { signer, ufvk, xpub, accountIndex } = buildSigner();
  const signerContext: SignerContext = (_deviceId, fn) => fn(signer);

  setZcashShieldedEnabled(true);

  // The local zaino node and explorer. Zaino is addressed as "mainnet" (the
  // network coin-zcash gives zcash_regtest), like every zcash-utils call here, to match
  // the mainnet-prefixed addresses coin-zcash's own classifier requires -- see
  // zcash_regtest.ts and signer.ts for the full rationale.
  const coinConfig: ZcashCoinConfig = {
    status: { type: "active" },
    name: "Zcash Regtest",
    unit: { name: "zcash", code: "𝚝ZEC", magnitude: 8 },
    zaino: { url: ZAINO_GRPC_URL },
    explorer: { url: EXPLORER_ORIGIN },
  };
  LiveConfig.setConfig({
    config_currency_zcash_regtest: {
      type: "object",
      default: {
        status: { type: "active" },
        name: "Zcash Regtest",
        unit: { name: "zcash", code: "𝚝ZEC", magnitude: 8 },
      },
    },
  });

  // The scenarios exercise the shielded engine, so the bridge runs it.
  const { accountBridge, currencyBridge } = createBridges(
    signerContext,
    {
      config: async () => coinConfig,
      logger: () => {},
    },
    { isShieldedEnabled: () => true },
  );
  const ZCASH_REGTEST = getCryptoCurrencyById("zcash_regtest");

  const getAddress = resolver(signerContext);
  const { address, publicKey } = await getAddress("", {
    path: `44'/${ZCASH_REGTEST.coinType}'/${accountIndex}'/0/0`,
    currency: ZCASH_REGTEST,
    derivationMode: "",
  });

  const account: ZcashAccount = makeAccount(xpub, publicKey, address, ZCASH_REGTEST, "", ufvk);

  return {
    // `@ledgerhq/coin-tester`'s executeScenario calls accountBridge.sync
    // with just `{ paginationConfig: {} }` -- coin-tester's own SyncConfig
    // is chain-agnostic, and has no notion of coin-zcash's own `syncType`
    // bitmask extension (`SYNC_TYPE_SHIELDED`, in `@ledgerhq/types-live`).
    // Without it, `buildExtraSyncObservable` (bridge/sync.ts) returns
    // `undefined` unconditionally and the Ironwood/Orchard scan never runs
    // at all -- ironwoodBalance stays exactly 0 forever, empirically
    // confirmed (not a slow-catch-up timing issue: 20 retries over 100s
    // made no difference). Forcing both bits on every sync call this
    // package's own scenario ever makes is the fix, entirely inside this
    // package -- coin-tester's shared core and coin-zcash's own source stay
    // untouched.
    accountBridge: {
      ...accountBridge,
      sync: (syncAccount: ZcashAccount, syncConfig: Parameters<typeof accountBridge.sync>[1]) =>
        accountBridge.sync(syncAccount, {
          ...syncConfig,
          syncType: (syncConfig.syncType ?? 0) | SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED,
        }),
    },
    currencyBridge,
    account,
    address,
    shieldedAddress: orchardAddressFromUfvk(ufvk),
  };
}
