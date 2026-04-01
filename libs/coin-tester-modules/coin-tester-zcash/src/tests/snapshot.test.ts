import path from "path";
import os from "os";
import fs from "fs/promises";
import { BigNumber } from "bignumber.js";
import {
  writeSnapshot,
  readSnapshot,
  snapshotToAccount,
  computeDerivedData,
  ufvkFingerprint,
  SNAPSHOT_FORMAT_VERSION,
} from "../core/snapshot";
import type { ZcashAccount } from "@ledgerhq/coin-bitcoin/types";
import type { ZcashPrivateInfo } from "@ledgerhq/zcash-shielded/types";
import { compress, decompress } from "../utils/compression";

function makeMinimalAccount(overrides: Partial<ZcashAccount> = {}): ZcashAccount {
  const privateInfo: ZcashPrivateInfo = {
    ufvk: "uview1test",
    orchardBalance: new BigNumber(100000000), // 1 ZEC
    saplingBalance: new BigNumber(50000000), // 0.5 ZEC
    syncState: "complete",
    birthday: "692345",
    lastSyncTimestamp: null,
    lastBlockProcessed: 800000,
    transactions: [],
  };

  return {
    type: "Account",
    id: "js:2:zcash:xpubTEST:0",
    seedIdentifier: "xpubTEST",
    name: "Test Account",
    currency: { id: "zcash" } as any,
    derivationMode: "",
    index: 0,
    freshAddress: "zs1test",
    freshAddressPath: "44'/133'/0'/0/0",
    freshAddresses: [],
    blockHeight: 800000,
    creationDate: new Date("2024-01-01"),
    operationsCount: 5,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2024-01-01"),
    balance: new BigNumber(350000000), // 2 ZEC transparent + 1.5 ZEC shielded = 3.5 ZEC total
    spendableBalance: new BigNumber(350000000),
    starred: false,
    used: true,
    swapHistory: [],
    nfts: [],
    bitcoinResources: { utxos: [] },
    privateInfo,
    ...overrides,
  } as unknown as ZcashAccount;
}

describe("ufvkFingerprint", () => {
  it("returns sha256: prefix with 16-char hex", () => {
    const fp = ufvkFingerprint("uview1test");
    expect(fp).toMatch(/^sha256:[0-9a-f]{16}$/);
  });

  it("is deterministic", () => {
    expect(ufvkFingerprint("uview1test")).toBe(ufvkFingerprint("uview1test"));
  });

  it("differs for different keys", () => {
    expect(ufvkFingerprint("uview1test")).not.toBe(ufvkFingerprint("uview1other"));
  });
});

describe("computeDerivedData", () => {
  it("computes balances from privateInfo", () => {
    const account = makeMinimalAccount();
    const derived = computeDerivedData(account);

    expect(derived.transparentBalance).toBe("2.00000000");
    expect(derived.shieldedBalance).toBe("1.50000000"); // 1 + 0.5 ZEC
    expect(derived.availableBalance).toBe("3.50000000");
    expect(derived.operationsCount).toBe(5);
    expect(derived.shieldedTxCount).toBe(0);
  });

  it("handles missing privateInfo", () => {
    const account = makeMinimalAccount({ privateInfo: undefined });
    const derived = computeDerivedData(account);

    expect(derived.shieldedBalance).toBe("0.00000000");
    expect(derived.availableBalance).toBe("3.50000000");
  });
});

describe("writeSnapshot / readSnapshot round-trip", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coin-tester-zcash-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("round-trips a snapshot without data loss", async () => {
    const account = makeMinimalAccount();
    const snapshotPath = path.join(tmpDir, "test.snapshot");

    await writeSnapshot(snapshotPath, account, {
      accountLabel: "test-account",
      ufvkFingerprint: "sha256:abcdef1234567890",
      birthHeight: 692345,
      snapshotHeight: 800000,
      chainTipAtCapture: 850000,
      coinBitcoinVersion: "1.0.0",
      zcashShieldedVersion: "0.7.1",
      network: "mainnet",
    });

    const snapshot = await readSnapshot(snapshotPath);

    expect(snapshot.metadata.formatVersion).toBe(SNAPSHOT_FORMAT_VERSION);
    expect(snapshot.metadata.accountLabel).toBe("test-account");
    expect(snapshot.metadata.snapshotHeight).toBe(800000);
    expect(snapshot.metadata.network).toBe("mainnet");
    expect(snapshot.derivedData.transparentBalance).toBe("2.00000000");
    expect(snapshot.derivedData.shieldedBalance).toBe("1.50000000");
  });

  it("restores ZcashAccount from snapshot", async () => {
    const account = makeMinimalAccount();
    const snapshotPath = path.join(tmpDir, "test.snapshot");

    await writeSnapshot(snapshotPath, account, {
      accountLabel: "test",
      ufvkFingerprint: "sha256:test",
      birthHeight: 692345,
      snapshotHeight: 800000,
      chainTipAtCapture: 850000,
      coinBitcoinVersion: "1.0.0",
      zcashShieldedVersion: "0.7.1",
      network: "mainnet",
    });

    const snapshot = await readSnapshot(snapshotPath);
    const restored = snapshotToAccount(snapshot);

    expect(restored.id).toBe("js:2:zcash:xpubTEST:0");
    expect(restored.blockHeight).toBe(800000);
    expect(restored.privateInfo).toBeDefined();
    expect(restored.privateInfo?.ufvk).toBe("uview1test");
    expect(restored.privateInfo?.syncState).toBe("complete");
  });

  it("throws on format version mismatch", async () => {
    const snapshotPath = path.join(tmpDir, "bad.snapshot");
    const account = makeMinimalAccount();

    await writeSnapshot(snapshotPath, account, {
      accountLabel: "test",
      ufvkFingerprint: "sha256:test",
      birthHeight: 0,
      snapshotHeight: 0,
      chainTipAtCapture: 0,
      coinBitcoinVersion: "1.0.0",
      zcashShieldedVersion: "0.7.1",
      network: "mainnet",
    });

    // Decompress and tamper with formatVersion
    const raw = await fs.readFile(snapshotPath);
    const json = await decompress(raw);
    const tampered = json.replace(
      `"formatVersion":${SNAPSHOT_FORMAT_VERSION}`,
      `"formatVersion":999`,
    );
    await fs.writeFile(snapshotPath, await compress(tampered));

    await expect(readSnapshot(snapshotPath)).rejects.toThrow("format version mismatch");
  });
});
