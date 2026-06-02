import type { ContactEntry } from "~/renderer/contacts/types";
import { groupAddressesByCrypto } from "../utils/groupAddressesByCrypto";

const stub = (overrides: Partial<ContactEntry> = {}): ContactEntry => ({
  scope: "Main",
  addressHex: "0xabcdef0000000000000000000000000000000001",
  hmacRestHex: "",
  derivationPath: "44'/60'/0'/0/0",
  chainId: 1,
  ...overrides,
});

// Composite key format mirrors `cryptoMeta.entryKey`:
// `${chainId}:${normalizedAddressLower}:${scope}` (no 0x prefix).
// Defaults to the entry's `Main` scope so existing tests written
// before the scope discriminator stay legible.
const metaKey = (addressHex: string, chainId: number, scope = "Main") =>
  `${chainId}:${(addressHex.startsWith("0x") ? addressHex.slice(2) : addressHex).toLowerCase()}:${scope}`;

describe("groupAddressesByCrypto", () => {
  it("returns no groups for an empty entries array", () => {
    expect(groupAddressesByCrypto([], {})).toEqual([]);
  });

  it("falls back to the chain-native gas token when no sidecar metadata is set", () => {
    const entry = stub({ chainId: 137 }); // Polygon
    const groups = groupAddressesByCrypto([entry], {});
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ cryptoId: "matic-network" });
  });

  it("uses the sidecar `cryptoMeta` when present, ignoring the chain-native fallback", () => {
    const usdcOnEth = stub({
      addressHex: "0xUSDCABCD000000000000000000000000000000ETH",
      chainId: 1,
    });
    const meta = {
      [metaKey(usdcOnEth.addressHex, usdcOnEth.chainId)]: "usd-coin",
    };
    const groups = groupAddressesByCrypto([usdcOnEth], meta);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ cryptoId: "usd-coin" });
  });

  it("buckets multiple entries of the same crypto into one group", () => {
    const a = stub({
      addressHex: "0x0000000000000000000000000000000000000001",
      chainId: 1,
    });
    const b = stub({
      addressHex: "0x0000000000000000000000000000000000000002",
      chainId: 137, // Polygon, but the user picked USDC at registration
    });
    const meta = {
      [metaKey(a.addressHex, a.chainId)]: "usd-coin",
      [metaKey(b.addressHex, b.chainId)]: "usd-coin",
    };

    const groups = groupAddressesByCrypto([a, b], meta);
    expect(groups).toHaveLength(1);
    if (groups[0].cryptoId !== "unknown") {
      expect(groups[0].entries).toHaveLength(2);
    }
  });

  it("section order follows the TOP_CRYPTOS market-cap ordering, not insertion order", () => {
    // Polygon's native fallback resolves to "matic-network" (rank > "ethereum").
    // Insertion order is [POL, ETH] but we expect [ETH, POL] back.
    const ethEntry = stub({
      addressHex: "0x0000000000000000000000000000000000000001",
      chainId: 1,
    });
    const polEntry = stub({
      addressHex: "0x0000000000000000000000000000000000000002",
      chainId: 137,
    });

    const groups = groupAddressesByCrypto([polEntry, ethEntry], {});
    expect(groups.map(g => g.cryptoId)).toEqual(["ethereum", "matic-network"]);
  });

  it("groups by chainId+addressHex composite — same address on two chains stays separate", () => {
    const address = "0x0000000000000000000000000000000000000001";
    const onEth = stub({ addressHex: address, chainId: 1 });
    const onPol = stub({ addressHex: address, chainId: 137 });
    // No sidecar — falls back to chain-native, so Ethereum bucket vs
    // Polygon bucket.
    const groups = groupAddressesByCrypto([onEth, onPol], {});

    expect(new Set(groups.map(g => g.cryptoId))).toEqual(
      new Set(["ethereum", "matic-network"]),
    );
  });

  it("drops entries with an unknown chainId AND no sidecar metadata into the unknown bucket", () => {
    const weirdChain = stub({ chainId: 999999 });
    const groups = groupAddressesByCrypto([weirdChain], {});
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ cryptoId: "unknown" });
  });

  it("keeps annotations distinct when two entries share (chainId, addressHex) but differ on scope", () => {
    // Same EVM address registered twice on Ethereum mainnet: once
    // tagged ETH (`scope=Main`), once tagged USDT (`scope=USDT bag`).
    // Each entry must resolve to its own crypto — the older bug
    // overwrote the first annotation when the second was written.
    const address = "0x8629ED785c05f8fB1962DBD633A4dd48313817f4";
    const ethEntry = stub({ addressHex: address, chainId: 1, scope: "Main" });
    const usdtEntry = stub({ addressHex: address, chainId: 1, scope: "USDT bag" });

    const meta = {
      [metaKey(address, 1, "Main")]: "ethereum",
      [metaKey(address, 1, "USDT bag")]: "tether",
    };

    const groups = groupAddressesByCrypto([ethEntry, usdtEntry], meta);

    // Two distinct buckets — each carrying exactly the matching entry.
    const byCrypto = Object.fromEntries(groups.map(g => [g.cryptoId, g]));
    expect(byCrypto["ethereum"]).toBeDefined();
    expect(byCrypto["tether"]).toBeDefined();
    if (byCrypto["ethereum"].cryptoId !== "unknown") {
      expect(byCrypto["ethereum"].entries).toEqual([ethEntry]);
    }
    if (byCrypto["tether"].cryptoId !== "unknown") {
      expect(byCrypto["tether"].entries).toEqual([usdtEntry]);
    }
  });

  it("falls back to the legacy 2-part key for entries written before the scope discriminator shipped", () => {
    // Legacy data: cryptoMeta stored without scope. Should still
    // resolve so the schema bump doesn't lose historical annotations.
    const entry = stub({ chainId: 1, scope: "doesn't matter" });
    const legacyKey = `${entry.chainId}:${entry.addressHex.toLowerCase().replace(/^0x/, "")}`;
    const meta = { [legacyKey]: "usd-coin" };

    const groups = groupAddressesByCrypto([entry], meta);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ cryptoId: "usd-coin" });
  });

  it("ignores sidecar metadata pointing at a crypto id not in TOP_CRYPTOS", () => {
    const entry = stub({ chainId: 1 });
    const meta = {
      [metaKey(entry.addressHex, entry.chainId)]: "this-id-does-not-exist",
    };
    const groups = groupAddressesByCrypto([entry], meta);
    // Falls back to the chain-native bucket, not the dangling sidecar id.
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ cryptoId: "unknown" });
  });
});
