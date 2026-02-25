import { extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import { pathStringToArray } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { buildKnownAddressDerivationsMap } from "../../knownAddressDerivations";

// ---- Helpers ---------------------------------------------------------------

/** Build a valid P2WPKH scriptPubKey (OP_0 <20-byte-hash>) used as a test fixture.
 *  The hash encodes (account, index) so the mock can round-trip through it. */
function makeP2wpkhScript(account: number, index: number): Buffer {
  const hash = Buffer.alloc(20, 0);
  hash[0] = account;
  hash[1] = index;
  return Buffer.concat([Buffer.from("0014", "hex"), hash]);
}

/** Get the map key that buildKnownAddressDerivationsMap stores for a given (account, index).
 *  Uses the real extractHashFromScriptPubKey — no reimplementation of internal logic. */
function scriptHashHex(account: number, index: number): string {
  const result = extractHashFromScriptPubKey(makeP2wpkhScript(account, index));
  if (!result) throw new Error(`Invalid P2WPKH fixture for (${account}, ${index})`);
  return result.hashHex;
}

/** Build a fake address string that the mock `toOutputScript` can parse back to (account, index). */
function makeAddr(account: number, index: number) {
  return { address: `bc1q_a${account}_i${index}`, account, index };
}

/** Build a deterministic 33-byte compressed pubkey from (account, index). */
function makePubkey(account: number, index: number): Buffer {
  const p = Buffer.alloc(33, 0);
  p[0] = 0x02;
  p[1] = account;
  p[2] = index;
  return p;
}

type StoredAddresses = ReturnType<typeof makeAddr>[];

/**
 * Builds a minimal walletAccount mock that simulates:
 *  - `getAccountAddresses(chain)` — returns pre-loaded stored addresses
 *  - `getNewAddress(chain, gap)` — returns address at `lastIndex + gap`
 *    (or index 0 when storage is empty, matching real Xpub behaviour)
 *  - `crypto.getPubkeyAt` — deterministic pubkey per (chain, index)
 *  - `crypto.toOutputScript` — P2WPKH script encoding (account, index)
 */
function makeWalletAccount(receiveStored: StoredAddresses, changeStored: StoredAddresses) {
  const getNewAddress = jest.fn().mockImplementation(async (account: number, gap: number) => {
    const stored = account === 0 ? receiveStored : changeStored;
    const lastIndex = stored.length > 0 ? Math.max(...stored.map(a => a.index)) : -1;
    const index = lastIndex === -1 ? 0 : lastIndex + gap;
    return makeAddr(account, index);
  });

  return {
    params: { path: "m/84'/0'/0'", index: 0 },
    xpub: {
      xpub: "xpub_test",
      getAccountAddresses: jest
        .fn()
        .mockImplementation(async (account: number) =>
          account === 0 ? receiveStored : changeStored,
        ),
      getNewAddress,
      crypto: {
        getPubkeyAt: jest
          .fn()
          .mockImplementation((_xpub: string, account: number, index: number) =>
            Promise.resolve(makePubkey(account, index)),
          ),
        toOutputScript: jest.fn().mockImplementation((address: string) => {
          const match = address.match(/^bc1q_a(\d+)_i(\d+)$/);
          if (!match) throw new Error(`Unexpected address in mock: ${address}`);
          return makeP2wpkhScript(parseInt(match[1]), parseInt(match[2]));
        }),
      },
    },
  };
}

// ---- Tests -----------------------------------------------------------------

describe("buildKnownAddressDerivationsMap", () => {
  const ACCOUNT_PATH = "m/84'/0'/0'";

  it("includes all stored receive and change addresses", async () => {
    const receiveStored = [makeAddr(0, 0), makeAddr(0, 1), makeAddr(0, 2)];
    const changeStored = [makeAddr(1, 0), makeAddr(1, 1)];
    const walletAccount = makeWalletAccount(receiveStored, changeStored);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    for (const addr of [...receiveStored, ...changeStored]) {
      expect(map.has(scriptHashHex(addr.account, addr.index))).toBe(true);
    }
  });

  it("includes the next 2 fresh change addresses beyond the last stored one (bug regression)", async () => {
    // Reproduces the original bug: a live-app PSBT uses a brand-new change address
    // (never seen in a transaction, absent from storage). Without this fix the
    // hardware app could not identify the change output.
    const changeStored = [
      makeAddr(1, 0),
      makeAddr(1, 1),
      makeAddr(1, 2),
      makeAddr(1, 3),
      makeAddr(1, 4),
      makeAddr(1, 5),
      makeAddr(1, 6),
      makeAddr(1, 7), // lastIndex = 7
    ];
    const walletAccount = makeWalletAccount([], changeStored);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    // index 8 (lastIndex+1) — the address the PSBT would use as change output
    expect(map.has(scriptHashHex(1, 8))).toBe(true);
    // index 9 (lastIndex+2) — covers WalletConnect and consecutive fresh-address flows
    expect(map.has(scriptHashHex(1, 9))).toBe(true);
  });

  it("includes the next 2 fresh receive addresses beyond the last stored one", async () => {
    const receiveStored = [makeAddr(0, 0), makeAddr(0, 1), makeAddr(0, 2)];
    const walletAccount = makeWalletAccount(receiveStored, []);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    expect(map.has(scriptHashHex(0, 3))).toBe(true); // lastIndex+1
    expect(map.has(scriptHashHex(0, 4))).toBe(true); // lastIndex+2
  });

  it("stores correct pubkey and derivation path for a fresh change address", async () => {
    const changeStored = [makeAddr(1, 0), makeAddr(1, 1)]; // lastIndex = 1
    const walletAccount = makeWalletAccount([], changeStored);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    const freshChangeEntry = map.get(scriptHashHex(1, 2)); // lastIndex+1
    expect(freshChangeEntry).toBeDefined();
    expect(freshChangeEntry!.pubkey).toEqual(makePubkey(1, 2));

    // Path = account base path + [chain, index] — uses the same pathStringToArray
    // as the implementation so the test tracks the contract, not the encoding.
    const basePath = pathStringToArray(ACCOUNT_PATH);
    expect(freshChangeEntry!.path).toEqual([...basePath, 1, 2]);
  });

  it("handles empty storage by including index-0 address for each chain", async () => {
    const walletAccount = makeWalletAccount([], []);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    // Both gap=1 and gap=2 resolve to index 0 when there are no stored addresses
    // (Xpub.getNewAddress returns index 0 when lastIndex === -1). The map
    // deduplicates by script hash, yielding one entry per chain.
    expect(map.has(scriptHashHex(0, 0))).toBe(true);
    expect(map.has(scriptHashHex(1, 0))).toBe(true);
  });

  it("total map size equals stored + 4 fresh entries when all addresses are unique", async () => {
    const receiveStored = [makeAddr(0, 0), makeAddr(0, 1)]; // 2 stored receive
    const changeStored = [makeAddr(1, 0), makeAddr(1, 1)]; // 2 stored change
    const walletAccount = makeWalletAccount(receiveStored, changeStored);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    // 2 receive stored + 2 fresh receive (idx 2, 3)
    // + 2 change stored + 2 fresh change (idx 2, 3)
    expect(map.size).toBe(8);
  });
});
