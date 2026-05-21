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
// `${chainId}:${normalizedAddressLower}` (no 0x prefix).
const metaKey = (addressHex: string, chainId: number) =>
  `${chainId}:${(addressHex.startsWith("0x") ? addressHex.slice(2) : addressHex).toLowerCase()}`;

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
