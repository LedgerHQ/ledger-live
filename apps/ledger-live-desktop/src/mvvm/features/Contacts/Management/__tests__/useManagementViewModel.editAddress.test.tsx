import { act } from "@testing-library/react";
import { renderHook } from "tests/testSetup";

// Mock the device boundary so the edit verbs are observable no-ops — we
// only want to exercise the cryptoMeta migration inside
// `onEditAddressOnDevice`, not the real DMK flow.
const editAddress = jest.fn().mockResolvedValue(undefined);
const editAddressLabel = jest.fn().mockResolvedValue(undefined);
const replaceAddress = jest.fn().mockResolvedValue(undefined);

jest.mock("~/renderer/contacts/useContacts", () => ({
  __esModule: true,
  useContacts: () => ({
    hydrated: true,
    wallet: { contacts: {}, accounts: {} },
    addContact: jest.fn(),
    addAddressToContact: jest.fn(),
    replaceAddress,
    editAddress,
    editAddressLabel,
    renameContact: jest.fn(),
    addLedgerAccount: jest.fn(),
    removeAddressFromContact: jest.fn().mockResolvedValue(undefined),
    removeContact: jest.fn().mockResolvedValue(undefined),
    upsertLocalContact: jest.fn().mockResolvedValue(undefined),
    renameLocalContact: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn(),
  }),
}));

import { useManagementViewModel } from "../hooks/useManagementViewModel";
import { readCryptoMeta, setCryptoMeta } from "../utils/cryptoMeta";
import type { ContactEntry } from "~/renderer/contacts/types";

const CHAIN = 1;
const OLD_ADDR = "0x8629ED785c05f8fB1962DBD633A4dd48313817f4";
const NEW_ADDR = "0x" + "b".repeat(40);
const SCOPE = "Ethereum 2";

const entry: ContactEntry = {
  addressHex: OLD_ADDR,
  chainId: CHAIN,
  scope: SCOPE,
  hmacRestHex: "h1",
  derivationPath: "44'/60'/0'/0/0",
};

beforeEach(() => {
  jest.clearAllMocks();
  // Clear any cryptoMeta this test seeded on a prior run.
  setCryptoMeta(OLD_ADDR, CHAIN, SCOPE, undefined);
  setCryptoMeta(NEW_ADDR, CHAIN, SCOPE, undefined);
});

describe("onEditAddressOnDevice — cryptoMeta migration", () => {
  it("preserves the crypto annotation when ONLY the address changes", async () => {
    // The entry is tagged USDT (`tether`) in the cosmetic sidecar.
    setCryptoMeta(OLD_ADDR, CHAIN, SCOPE, "tether");
    expect(readCryptoMeta(OLD_ADDR, CHAIN, SCOPE)).toBe("tether");

    const { result } = renderHook(() => useManagementViewModel());

    await act(async () => {
      await result.current.onEditAddressOnDevice("Benoit", entry, {
        newAddressHex: NEW_ADDR,
        newScope: SCOPE, // unchanged
      })("device-1");
    });

    // Address-only → editAddress, NOT replace.
    expect(editAddress).toHaveBeenCalledTimes(1);
    expect(replaceAddress).not.toHaveBeenCalled();

    // The annotation must move to the NEW address key (so the grouping
    // keeps showing USDT, not the chain-native fallback), and the old
    // key must be cleared.
    expect(readCryptoMeta(NEW_ADDR, CHAIN, SCOPE)).toBe("tether");
    expect(readCryptoMeta(OLD_ADDR, CHAIN, SCOPE)).toBeUndefined();
  });

  it("preserves the crypto annotation when ONLY the name changes", async () => {
    setCryptoMeta(OLD_ADDR, CHAIN, SCOPE, "tether");

    const { result } = renderHook(() => useManagementViewModel());

    await act(async () => {
      await result.current.onEditAddressOnDevice("Benoit", entry, {
        newAddressHex: OLD_ADDR, // unchanged
        newScope: "Renamed",
      })("device-1");
    });

    expect(editAddressLabel).toHaveBeenCalledTimes(1);
    expect(readCryptoMeta(OLD_ADDR, CHAIN, "Renamed")).toBe("tether");
    expect(readCryptoMeta(OLD_ADDR, CHAIN, SCOPE)).toBeUndefined();
  });

  it("preserves the crypto annotation when BOTH change (register + drop old)", async () => {
    setCryptoMeta(OLD_ADDR, CHAIN, SCOPE, "tether");

    const { result } = renderHook(() => useManagementViewModel());

    await act(async () => {
      await result.current.onEditAddressOnDevice("Benoit", entry, {
        newAddressHex: NEW_ADDR,
        newScope: "USDT bag",
      })("device-1");
    });

    expect(replaceAddress).toHaveBeenCalledTimes(1);
    expect(readCryptoMeta(NEW_ADDR, CHAIN, "USDT bag")).toBe("tether");
    expect(readCryptoMeta(OLD_ADDR, CHAIN, SCOPE)).toBeUndefined();
  });

  it("seeds the new key BEFORE the device commit (no chain-native flicker)", async () => {
    setCryptoMeta(OLD_ADDR, CHAIN, SCOPE, "tether");

    // Assert the new key is already populated at the moment the device
    // verb runs — i.e. before the wallet commit that re-renders the list.
    editAddress.mockImplementationOnce(async () => {
      expect(readCryptoMeta(NEW_ADDR, CHAIN, SCOPE)).toBe("tether");
      return undefined;
    });

    const { result } = renderHook(() => useManagementViewModel());
    await act(async () => {
      await result.current.onEditAddressOnDevice("Benoit", entry, {
        newAddressHex: NEW_ADDR,
        newScope: SCOPE,
      })("device-1");
    });

    expect(editAddress).toHaveBeenCalledTimes(1);
  });

  it("reverts the optimistic new-key write when the device call fails", async () => {
    setCryptoMeta(OLD_ADDR, CHAIN, SCOPE, "tether");
    editAddress.mockRejectedValueOnce(new Error("device cancelled"));

    const { result } = renderHook(() => useManagementViewModel());

    await act(async () => {
      await expect(
        result.current.onEditAddressOnDevice("Benoit", entry, {
          newAddressHex: NEW_ADDR,
          newScope: SCOPE,
        })("device-1"),
      ).rejects.toThrow("device cancelled");
    });

    // New key reverted; old entry keeps its annotation.
    expect(readCryptoMeta(NEW_ADDR, CHAIN, SCOPE)).toBeUndefined();
    expect(readCryptoMeta(OLD_ADDR, CHAIN, SCOPE)).toBe("tether");
  });
});
