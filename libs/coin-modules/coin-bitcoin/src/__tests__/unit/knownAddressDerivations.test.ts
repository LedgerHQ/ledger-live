import { extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
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
 *  - `GAP` — the gap limit (20 by default, like the real Xpub)
 *  - `crypto.getAddress` — deterministic address per (chain, index)
 *  - `crypto.getPubkeyAt` — deterministic pubkey per (chain, index)
 *  - `crypto.toOutputScript` — P2WPKH script encoding (account, index)
 */
function makeWalletAccount(
  receiveStored: StoredAddresses,
  changeStored: StoredAddresses,
  gap = 20,
) {
  return {
    params: { path: "m/84'/0'/0'", index: 0 },
    xpub: {
      xpub: "xpub_test",
      derivationMode: "native_segwit",
      GAP: gap,
      getAccountAddresses: jest
        .fn()
        .mockImplementation(async (account: number) =>
          account === 0 ? receiveStored : changeStored,
        ),
      crypto: {
        getAddress: jest
          .fn()
          .mockImplementation(
            async (_derivationMode: string, _xpub: string, account: number, index: number) =>
              makeAddr(account, index).address,
          ),
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

/** Builds stored addresses 0..lastIndex on one chain. */
function storedRange(account: number, lastIndex: number): StoredAddresses {
  return Array.from({ length: lastIndex + 1 }, (_, index) => makeAddr(account, index));
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

    // Path = account base path + [chain, index] — uses the same pathStringToArray
    // as the implementation so the test tracks the contract, not the encoding.
    const basePath = pathStringToArray(ACCOUNT_PATH);
    expect(freshChangeEntry).toEqual({
      pubkey: makePubkey(1, 2),
      path: [...basePath, 1, 2],
    });
  });

  it("handles empty storage by including the first GAP addresses of each chain", async () => {
    const walletAccount = makeWalletAccount([], []);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    for (const account of [0, 1]) {
      for (let index = 0; index < 20; index++) {
        expect(map.has(scriptHashHex(account, index))).toBe(true);
      }
      expect(map.has(scriptHashHex(account, 20))).toBe(false);
    }
  });

  it("includes a fresh change address that is not the first unused one when no change is stored", async () => {
    // A live app may pick a later fresh change address (1/1) on an account that never used its
    // change chain. Without a derivation for it, the device counts the change as an external output.
    const walletAccount = makeWalletAccount([makeAddr(0, 0)], []);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    expect(map.get(scriptHashHex(1, 1))).toEqual({
      pubkey: makePubkey(1, 1),
      path: [...pathStringToArray(ACCOUNT_PATH), 1, 1],
    });
  });

  it("includes the GAP addresses after the highest stored index and none beyond", async () => {
    const walletAccount = makeWalletAccount(storedRange(0, 2), storedRange(1, 4));

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    for (let index = 5; index <= 24; index++) {
      expect(map.has(scriptHashHex(1, index))).toBe(true);
    }
    expect(map.has(scriptHashHex(1, 25))).toBe(false);
    expect(map.has(scriptHashHex(0, 22))).toBe(true);
    expect(map.has(scriptHashHex(0, 23))).toBe(false);
  });

  it("starts the window after the highest stored index even when stored indexes have holes", async () => {
    const walletAccount = makeWalletAccount([], [makeAddr(1, 0), makeAddr(1, 7)], 3);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    expect(map.has(scriptHashHex(1, 8))).toBe(true);
    expect(map.has(scriptHashHex(1, 10))).toBe(true);
    expect(map.has(scriptHashHex(1, 11))).toBe(false);
  });

  it("follows the gap limit of the account", async () => {
    const walletAccount = makeWalletAccount([], [], 5);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    expect(map.has(scriptHashHex(1, 4))).toBe(true);
    expect(map.has(scriptHashHex(1, 5))).toBe(false);
  });

  it("total map size equals stored + GAP fresh entries per chain when all addresses are unique", async () => {
    const receiveStored = [makeAddr(0, 0), makeAddr(0, 1)]; // 2 stored receive
    const changeStored = [makeAddr(1, 0), makeAddr(1, 1)]; // 2 stored change
    const walletAccount = makeWalletAccount(receiveStored, changeStored);

    const map = await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    // per chain: 2 stored + 20 fresh (idx 2..21)
    expect(map.size).toBe(44);
  });

  it("derives addresses only for the fresh window, reusing stored addresses", async () => {
    const walletAccount = makeWalletAccount(storedRange(0, 2), storedRange(1, 1));

    await buildKnownAddressDerivationsMap(walletAccount as any, ACCOUNT_PATH);

    expect(walletAccount.xpub.crypto.getAddress).toHaveBeenCalledTimes(40);
    expect(walletAccount.xpub.crypto.getAddress).not.toHaveBeenCalledWith(
      "native_segwit",
      "xpub_test",
      0,
      2,
    );
  });
});
