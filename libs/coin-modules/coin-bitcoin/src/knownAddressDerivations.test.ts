import { buildKnownAddressDerivationsMap, FRESH_ADDRESS_WINDOW } from "./knownAddressDerivations";

type Addr = { address: string; account: number; index: number };

// A fake P2WPKH address encodes its chain and index, so the map key can be predicted.
const hashFor = (chain: number, index: number) =>
  `${chain.toString(16).padStart(2, "0")}${index.toString(16).padStart(38, "0")}`;

const toAddr = (chain: number, index: number): Addr => ({
  address: `addr-${chain}-${index}`,
  account: chain,
  index,
});

function makeWalletAccount(stored: { 0: number[]; 1: number[] }) {
  return {
    xpub: {
      xpub: "tpub-test",
      derivationMode: "native_segwit",
      getAccountAddresses: async (chain: 0 | 1) => stored[chain].map(i => toAddr(chain, i)),
      crypto: {
        getAddress: async (_mode: string, _xpub: string, chain: number, index: number) =>
          `addr-${chain}-${index}`,
        getPubkeyAt: async (_xpub: string, chain: number, index: number) =>
          Buffer.from([0x02, chain, index]),
        toOutputScript: (address: string) => {
          const [, chain, index] = address.split("-").map(Number);
          return Buffer.from(`0014${hashFor(chain, index)}`, "hex");
        },
      },
    },
  } as never;
}

const pathsIn = (map: Map<string, { path: number[] }>) =>
  [...map.values()].map(({ path }) => path.slice(-2).join("/"));

describe("buildKnownAddressDerivationsMap", () => {
  it("covers fresh change addresses beyond index 0 when no change address is stored", async () => {
    const map = await buildKnownAddressDerivationsMap(
      makeWalletAccount({ 0: [0], 1: [] }),
      "84'/1'/0'",
    );
    const paths = pathsIn(map);
    expect(paths).toContain("1/0");
    expect(paths).toContain("1/1");
    expect(paths).toContain(`1/${FRESH_ADDRESS_WINDOW - 1}`);
    expect(paths).not.toContain(`1/${FRESH_ADDRESS_WINDOW}`);
  });

  it("starts the fresh window right after the highest stored index", async () => {
    const map = await buildKnownAddressDerivationsMap(
      makeWalletAccount({ 0: [0, 1, 2], 1: [0, 4] }),
      "84'/1'/0'",
    );
    const paths = pathsIn(map);
    expect(paths).toEqual(expect.arrayContaining(["0/0", "0/2", "0/3", "1/4", "1/5", "1/24"]));
    expect(paths).not.toContain("1/25");
    expect(paths).not.toContain("0/23");
  });

  it("maps each script hash to the full derivation path and its pubkey", async () => {
    const map = await buildKnownAddressDerivationsMap(
      makeWalletAccount({ 0: [], 1: [] }),
      "84'/1'/0'",
    );
    const entry = map.get(hashFor(1, 1));
    expect(entry?.path.slice(-2)).toEqual([1, 1]);
    expect(entry?.path).toHaveLength(5);
    expect(entry?.pubkey).toEqual(Buffer.from([0x02, 1, 1]));
  });
});
