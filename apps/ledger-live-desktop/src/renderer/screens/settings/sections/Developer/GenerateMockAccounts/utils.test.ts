import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/live-common/mock/account";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(async () => []),
}));

let saved: Account[] = [];
jest.mock("~/renderer/actions/accounts", () => ({
  initAccounts: jest.fn(),
}));
jest.mock("~/renderer/reducers/wallet", () => ({
  initialState: {},
  accountUserDataExportSelector: jest.fn(() => ({})),
}));
jest.mock("~/renderer/reducers/settings", () => ({ initialState: {} }));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const ethereum = getCryptoCurrencyById("ethereum");

// A device-derived account: real id/address, no "mock:" prefix.
const deviceAccount = (): Account => ({
  ...genAccount("device", { currency: ethereum, operationsSize: 0 }),
  id: "js:2:ethereum:0x380C0f976D55382B7431F56943B5C2a9d01c0B8F:",
  seedIdentifier: "04a2d1c725",
  freshAddress: "0x380C0f976D55382B7431F56943B5C2a9d01c0B8F",
  operations: [],
});

describe("addMockOperationsToAllAccounts", () => {
  beforeEach(() => {
    jest.resetModules();
    saved = [];
    // injectMockAccounts dispatches through the running app's store.
    (window as unknown as { ledger: unknown }).ledger = { store: { dispatch: jest.fn() } };
  });

  it("marks device-derived accounts and leaves mock accounts untouched", async () => {
    const mockAccount = genAccount("mock-seed", { currency: ethereum });
    expect(mockAccount.id.startsWith("mock:")).toBe(true);

    const device = deviceAccount();
    saved = [mockAccount, device];

    jest.doMock("~/renderer/storage", () => ({
      getKey: jest.fn(async () => saved.map(a => [a, {}])),
    }));

    const { addMockOperationsToAllAccounts } = await import("./utils");
    const { DEMO_HISTORY_SEED } = await import("~/renderer/bridge/demoHistory");
    const processed = await addMockOperationsToAllAccounts(3);
    await flush();

    expect(processed).toBe(2);

    const { initAccounts } = await import("~/renderer/actions/accounts");
    const [accounts] = (initAccounts as jest.Mock).mock.calls.at(-1)!;
    const [persistedMock, persistedDevice] = accounts.map(([a]: [Account]) => a);

    // Mock accounts keep their generated history and are not tagged.
    expect(persistedMock).toBe(mockAccount);
    expect(persistedMock.seedIdentifier).toBe("mock");

    // The device account gains operations but keeps its identity, so Receive still matches.
    expect(persistedDevice.seedIdentifier).toBe(DEMO_HISTORY_SEED);
    expect(persistedDevice.id).toBe(device.id);
    expect(persistedDevice.freshAddress).toBe(device.freshAddress);
    expect(persistedDevice.operations.length).toBe(3);
  });

  it("generates new operations on a second run instead of repeating the first batch", async () => {
    const device = deviceAccount();
    saved = [device];

    jest.doMock("~/renderer/storage", () => ({
      getKey: jest.fn(async () => saved.map(a => [a, {}])),
    }));

    const { addMockOperationsToAllAccounts } = await import("./utils");
    await addMockOperationsToAllAccounts(3);
    const { initAccounts } = await import("~/renderer/actions/accounts");
    const second = (initAccounts as jest.Mock).mock.calls.at(-1)![0][0][0] as Account;

    saved = [second];
    await addMockOperationsToAllAccounts(3);
    const third = (initAccounts as jest.Mock).mock.calls.at(-1)![0][0][0] as Account;

    const ids = third.operations.map(o => o.id);
    expect(ids.length).toBe(6);
    expect(new Set(ids).size).toBe(6);
  });
});
