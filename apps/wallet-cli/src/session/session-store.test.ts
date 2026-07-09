import { describe, expect, it, afterEach } from "bun:test";
import { YAML } from "bun";
import { statSync, mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { generateLabel, getSessionPath, Session } from "./session-store";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";

const btcNative: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name: "bitcoin", env: "main" },
  xpub: "xpub6BosfCnifzxcA",
  path: "m/84h/0h/0h",
};

const btcNative2: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name: "bitcoin", env: "main" },
  xpub: "xpub6BosfCnifzxcB",
  path: "m/84h/0h/1h",
};

const btcLegacy: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name: "bitcoin", env: "main" },
  xpub: "xpub6BosfCnifzxcC",
  path: "m/44h/0h/0h",
};

const btcSegwit: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name: "bitcoin", env: "main" },
  xpub: "xpubSEGWIT",
  path: "m/49h/0h/0h",
};

const btcTaproot: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name: "bitcoin", env: "main" },
  xpub: "xpubTAPROOT",
  path: "m/86h/0h/0h",
};

const btcTestnet: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "utxo",
  network: { name: "bitcoin", env: "testnet" },
  xpub: "tpub1234",
  path: "m/84h/1h/0h",
};

const ethMain: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "main" },
  address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  path: "m/44h/60h/0h/0/0",
};

const ethGoerli: AccountDescriptorV1 = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "goerli" },
  address: "0xabc",
  path: "m/44h/60h/0h/0/0",
};

describe("generateLabel", () => {
  it("bitcoin mainnet native segwit → bitcoin-native-1", () => {
    expect(generateLabel(btcNative, new Set())).toBe("bitcoin-native-1");
  });

  it("bitcoin mainnet legacy → bitcoin-legacy-1", () => {
    expect(generateLabel(btcLegacy, new Set())).toBe("bitcoin-legacy-1");
  });

  it("bitcoin mainnet segwit → bitcoin-segwit-1", () => {
    expect(generateLabel(btcSegwit, new Set())).toBe("bitcoin-segwit-1");
  });

  it("bitcoin mainnet taproot → bitcoin-taproot-1", () => {
    expect(generateLabel(btcTaproot, new Set())).toBe("bitcoin-taproot-1");
  });

  it("bitcoin testnet native → bitcoin-native-testnet-1", () => {
    expect(generateLabel(btcTestnet, new Set())).toBe("bitcoin-native-testnet-1");
  });

  it("ethereum mainnet address-based → ethereum-1 (no derivation segment)", () => {
    expect(generateLabel(ethMain, new Set())).toBe("ethereum-1");
  });

  it("ethereum goerli address-based → ethereum-goerli-1", () => {
    expect(generateLabel(ethGoerli, new Set())).toBe("ethereum-goerli-1");
  });

  it("increments counter when label is taken", () => {
    const taken = new Set(["bitcoin-native-1"]);
    expect(generateLabel(btcNative, taken)).toBe("bitcoin-native-2");
  });

  it("skips multiple taken labels", () => {
    const taken = new Set(["bitcoin-native-1", "bitcoin-native-2"]);
    expect(generateLabel(btcNative, taken)).toBe("bitcoin-native-3");
  });
});

describe("Session.addDescriptors", () => {
  it("appends new descriptors with auto-labels", () => {
    const session = Session.from([]);
    const added = session.addDescriptors([btcNative, ethMain]);
    expect(added).toBe(2);
    expect(session.accounts).toHaveLength(2);
    expect(session.accounts[0].label).toBe("bitcoin-native-1");
    expect(session.accounts[1].label).toBe("ethereum-1");
  });

  it("skips already-known descriptors", () => {
    const existing = [
      {
        label: "bitcoin-native-1",
        descriptor: "account:1:utxo:bitcoin:main:xpub6BosfCnifzxcA:m/84h/0h/0h",
      },
    ];
    const session = Session.from(existing);
    const added = session.addDescriptors([btcNative]);
    expect(added).toBe(0);
    expect(session.accounts).toHaveLength(1);
  });

  it("never removes existing entries", () => {
    const existing = [
      {
        label: "bitcoin-native-1",
        descriptor: "account:1:utxo:bitcoin:main:xpub6BosfCnifzxcA:m/84h/0h/0h",
      },
    ];
    const session = Session.from(existing);
    session.addDescriptors([]);
    expect(session.accounts).toHaveLength(1);
    expect(session.accounts[0].label).toBe("bitcoin-native-1");
  });

  it("increments label counter to avoid collision with existing", () => {
    const existing = [
      {
        label: "bitcoin-native-1",
        descriptor: "account:1:utxo:bitcoin:main:xpubOTHER:m/84h/0h/0h",
      },
    ];
    const session = Session.from(existing);
    session.addDescriptors([btcNative]);
    expect(session.accounts).toHaveLength(2);
    expect(session.accounts[1].label).toBe("bitcoin-native-2");
  });

  it("assigns sequential labels for multiple new accounts of same type", () => {
    const session = Session.from([]);
    session.addDescriptors([btcNative, btcNative2]);
    expect(session.accounts[0].label).toBe("bitcoin-native-1");
    expect(session.accounts[1].label).toBe("bitcoin-native-2");
  });
});

describe("YAML round-trip", () => {
  it("session serializes and parses back intact", () => {
    const session = Session.from([]);
    session.addDescriptors([btcNative, ethMain, btcTestnet]);
    const entries = session.accounts;
    const yaml = YAML.stringify({ accounts: entries });
    const parsed = YAML.parse(yaml);
    expect(parsed).toEqual({ accounts: entries });
  });
});

describe("ring-field resilience", () => {
  let tmpDir: string | undefined;
  let savedEnv: string | undefined;

  afterEach(() => {
    if (savedEnv === undefined) delete process.env.XDG_STATE_HOME;
    else process.env.XDG_STATE_HOME = savedEnv;
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  function useTmpState(): void {
    savedEnv = process.env.XDG_STATE_HOME;
    tmpDir = mkdtempSync(join(tmpdir(), "wallet-cli-ring-"));
    process.env.XDG_STATE_HOME = tmpDir;
    mkdirSync(dirname(getSessionPath()), { recursive: true });
  }

  it("still loads accounts when passwordSalt is malformed (no whole-file failure)", async () => {
    useTmpState();
    writeFileSync(
      getSessionPath(),
      YAML.stringify({
        accounts: [
          {
            label: "ethereum-1",
            descriptor: "account:1:address:ethereum:main:0xabc:m/44h/60h/0h/0/0",
          },
        ],
        passwordSalt: "NOT-A-VALID-SALT",
      }),
    );
    const session = await Session.read();
    expect(session.accounts).toHaveLength(1);
    expect(session.accounts[0].label).toBe("ethereum-1");
  });

  it("drops a malformed passwordSalt to undefined instead of retaining it verbatim", async () => {
    useTmpState();
    writeFileSync(
      getSessionPath(),
      YAML.stringify({ accounts: [], passwordSalt: "NOT-A-VALID-SALT" }),
    );
    const session = await Session.read();
    expect(session.passwordSalt).toBeUndefined();
  });

  it("drops a non-string passwordSalt to undefined without throwing", async () => {
    useTmpState();
    writeFileSync(getSessionPath(), YAML.stringify({ accounts: [], passwordSalt: 12345 }));
    const session = await Session.read();
    expect(session.passwordSalt).toBeUndefined();
  });

  it("keeps a well-formed passwordSalt", async () => {
    useTmpState();
    const salt = "0".repeat(32);
    writeFileSync(getSessionPath(), YAML.stringify({ accounts: [], passwordSalt: salt }));
    const session = await Session.read();
    expect(session.passwordSalt).toBe(salt);
  });

  it("drops only malformed domain entries, keeping the valid ones", async () => {
    useTmpState();
    writeFileSync(
      getSessionPath(),
      YAML.stringify({
        accounts: [],
        domains: [
          { domain: "good-key", firstUsed: "2026-01-01T00:00:00.000Z" },
          { domain: "missing-firstUsed" }, // malformed — must not nuke the whole list
        ],
      }),
    );
    const session = await Session.read();
    expect(session.domains.map(d => d.domain)).toEqual(["good-key"]);
  });

  it("still loads accounts when trustchain/domains are malformed (no whole-file failure)", async () => {
    useTmpState();
    writeFileSync(
      getSessionPath(),
      YAML.stringify({
        accounts: [
          {
            label: "ethereum-1",
            descriptor: "account:1:address:ethereum:main:0xabc:m/44h/60h/0h/0/0",
          },
        ],
        trustchain: "not-an-object", // malformed
        domains: "not-an-array", // malformed
      }),
    );
    const session = await Session.read();
    expect(session.accounts).toHaveLength(1);
    expect(session.trustchain).toBeUndefined();
    expect(session.domains).toHaveLength(0);
  });

  it("readForReset preserves the trustchain even when the file is otherwise corrupt", async () => {
    useTmpState();
    writeFileSync(
      getSessionPath(),
      YAML.stringify({
        accounts: [{ label: "bad label with spaces", descriptor: 42 }], // fails schema
        trustchain: { rootId: "root-abc", applicationPath: "m/0'/17'/0'" },
        passwordSalt: "0".repeat(32),
      }),
    );
    const session = await Session.readForReset();
    expect(session.accounts).toHaveLength(0);
    expect(session.trustchain).toEqual({ rootId: "root-abc", applicationPath: "m/0'/17'/0'" });
    expect(session.passwordSalt).toBe("0".repeat(32));
  });
});

describe("Session.write() permissions", () => {
  let tmpDir: string | undefined;
  let savedEnv: string | undefined;

  afterEach(() => {
    if (savedEnv === undefined) delete process.env.XDG_STATE_HOME;
    else process.env.XDG_STATE_HOME = savedEnv;
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates state dir 0700 and session file 0600", () => {
    savedEnv = process.env.XDG_STATE_HOME;
    tmpDir = mkdtempSync(join(tmpdir(), "wallet-cli-perm-"));
    process.env.XDG_STATE_HOME = tmpDir;

    Session.from([]).write();

    const sessionFile = getSessionPath();
    expect(statSync(dirname(sessionFile)).mode & 0o777).toBe(0o700);
    expect(statSync(sessionFile).mode & 0o777).toBe(0o600);
  });

  it("corrects too-permissive existing dir and file to 0700/0600", () => {
    savedEnv = process.env.XDG_STATE_HOME;
    tmpDir = mkdtempSync(join(tmpdir(), "wallet-cli-perm-"));
    process.env.XDG_STATE_HOME = tmpDir;

    // Pre-create with permissive modes (simulating a prior installation)
    const stateDirectory = dirname(getSessionPath());
    mkdirSync(stateDirectory, { recursive: true });
    chmodSync(stateDirectory, 0o755);
    writeFileSync(getSessionPath(), "", { mode: 0o644 });
    chmodSync(getSessionPath(), 0o644);

    Session.from([]).write();

    expect(statSync(stateDirectory).mode & 0o777).toBe(0o700);
    expect(statSync(getSessionPath()).mode & 0o777).toBe(0o600);
  });
});
