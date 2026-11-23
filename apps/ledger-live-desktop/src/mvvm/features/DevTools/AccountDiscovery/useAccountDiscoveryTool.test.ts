import { act } from "@testing-library/react";
import { renderHook } from "tests/testSetup";
import { useAccountDiscoveryToolState } from "@devtools/bindings";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { Account } from "@ledgerhq/types-live";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { useAccountDiscoveryTool } from "./useAccountDiscoveryTool";

jest.mock("@devtools/bindings", () => ({ useAccountDiscoveryToolState: jest.fn(() => ({})) }));
const mockSyncDetached = jest.fn<Promise<Account>, [AccountDescriptor, unknown, unknown]>();
jest.mock("@ledgerhq/live-common/account-data/full-sync/syncDetached", () => ({
  syncDetached: (...args: [AccountDescriptor, unknown, unknown]) => mockSyncDetached(...args),
}));

const cardanoResources = {
  externalCredentials: [],
  internalCredentials: [],
  delegation: undefined,
  utxos: [],
  protocolParams: {},
};
const cardano: Account = Object.assign(
  genAccount("cardano-discovered", { currency: getCryptoCurrencyById("cardano") }),
  { cardanoResources },
);
const bitcoin = genAccount("bitcoin-discovered", { currency: getCryptoCurrencyById("bitcoin") });

function lastAddAccounts() {
  const params = jest.mocked(useAccountDiscoveryToolState).mock.lastCall?.[0];
  if (!params) throw new Error("the tool state was not built");
  return params.addAccounts;
}

describe("useAccountDiscoveryTool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should add the account its family's sync built, with the family's resources", async () => {
    mockSyncDetached.mockResolvedValue(cardano);
    const descriptor = fromLegacyAccount(cardano);
    const { store } = renderHook(() => useAccountDiscoveryTool());

    await act(() => lastAddAccounts()([descriptor]));

    expect(mockSyncDetached).toHaveBeenCalledWith(
      descriptor,
      { prepareCurrency, blacklistedTokenIds: expect.any(Array) },
      undefined,
    );
    expect(store.getState().accounts).toEqual([expect.objectContaining({ cardanoResources })]);
  });

  it("should add the synced accounts and report the ones whose sync failed", async () => {
    const bitcoinNetwork = fromLegacyAccount(bitcoin).network;
    mockSyncDetached.mockImplementation(async descriptor =>
      descriptor.network === bitcoinNetwork ? bitcoin : Promise.reject(new Error("network down")),
    );
    const { store } = renderHook(() => useAccountDiscoveryTool());

    await act(() =>
      expect(
        lastAddAccounts()([fromLegacyAccount(cardano), fromLegacyAccount(bitcoin)]),
      ).rejects.toThrow("1 of 2 not synced: Error: network down"),
    );

    expect(store.getState().accounts).toEqual([expect.objectContaining({ id: bitcoin.id })]);
  });

  it("should not add an EVM account the store got meanwhile under a checksummed address", async () => {
    const checksummed = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    const held: Account = {
      ...genAccount("ethereum-held", { currency: getCryptoCurrencyById("ethereum") }),
      id: `js:2:ethereum:${checksummed}:`,
      freshAddress: checksummed,
    };
    const synced: Account = {
      ...held,
      id: `js:2:ethereum:${checksummed.toLowerCase()}:`,
      freshAddress: checksummed.toLowerCase(),
    };
    mockSyncDetached.mockResolvedValue(synced);
    const { store } = renderHook(() => useAccountDiscoveryTool(), {
      initialState: { accounts: [held] },
    });

    await act(() => lastAddAccounts()([fromLegacyAccount(synced)]));

    expect(store.getState().accounts).toEqual([expect.objectContaining({ id: held.id })]);
  });
});
