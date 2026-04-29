import { describe, expect, it } from "bun:test";
import { YAML } from "bun";
import { generateLabel, Session } from "./session-store";
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
    const existing = [{ label: "bitcoin-native-1", descriptor: "account:1:utxo:bitcoin:main:xpub6BosfCnifzxcA:m/84h/0h/0h" }];
    const session = Session.from(existing);
    const added = session.addDescriptors([btcNative]);
    expect(added).toBe(0);
    expect(session.accounts).toHaveLength(1);
  });

  it("never removes existing entries", () => {
    const existing = [{ label: "bitcoin-native-1", descriptor: "account:1:utxo:bitcoin:main:xpub6BosfCnifzxcA:m/84h/0h/0h" }];
    const session = Session.from(existing);
    session.addDescriptors([]);
    expect(session.accounts).toHaveLength(1);
    expect(session.accounts[0].label).toBe("bitcoin-native-1");
  });

  it("increments label counter to avoid collision with existing", () => {
    const existing = [{ label: "bitcoin-native-1", descriptor: "account:1:utxo:bitcoin:main:xpubOTHER:m/84h/0h/0h" }];
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
