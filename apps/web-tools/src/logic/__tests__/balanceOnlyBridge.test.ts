import BigNumber from "bignumber.js";
import { lastValueFrom } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import type { AccountBalance } from "@domain/entity-account-balance";
import { balanceOnlyAccountBridge } from "../balanceOnlyBridge";

const fetchMock = jest.fn();
const getStatusMock = jest.fn();
const rowsMock = jest.fn();
const rememberMock = jest.fn();

// The composition root pulls in live-common's bridge and coin-module registries; the bridge under
// test only cares that it asks the scheduler for `balance` and applies what lands in the table.
jest.mock("../accountData", () => ({
  accountDataScheduler: {
    fetch: (...args: unknown[]) => fetchMock(...args),
    getStatus: (...args: unknown[]) => getStatusMock(...args),
  },
  accountBalanceRowsOf: (...args: unknown[]) => rowsMock(...args),
  accountRefOf: (account: Account) => ({
    accountId: account.id,
    currencyId: account.currency.id,
    address: account.freshAddress,
    derivationMode: account.derivationMode,
  }),
  rememberShapedAccount: (...args: unknown[]) => rememberMock(...args),
}));

const ACCOUNT_ID = "js:2:ethereum:0xabc:";

const account = {
  type: "Account",
  id: ACCOUNT_ID,
  currency: { id: "ethereum" },
  derivationMode: "",
  freshAddress: "0xabc",
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  lastSyncDate: new Date(0),
} as unknown as Account;

// Plain strings, cast once: the bridge only reads them back out, so branding them adds noise.
const row = (overrides: Record<string, string> = {}) =>
  ({
    accountId: ACCOUNT_ID,
    assetId: "ethereum",
    balance: "1500",
    spendableBalance: "1400",
    at: "2026-01-31T12:00:00.000Z",
    ...overrides,
  }) as unknown as AccountBalance;

const SYNC_CONFIG = { paginationConfig: {} };
const runSync = () => lastValueFrom(balanceOnlyAccountBridge().sync(account, SYNC_CONFIG));

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockResolvedValue(undefined);
  getStatusMock.mockReturnValue({ pending: false });
  rowsMock.mockReturnValue([row()]);
});

describe("balanceOnlyAccountBridge", () => {
  it("asks the scheduler for the balance slice only", async () => {
    await runSync();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatchObject({
      slices: ["balance"],
      reason: "ledger-sync-resolve",
    });
  });

  it("forces a round-trip rather than serving a cached balance", async () => {
    await runSync();
    expect(fetchMock.mock.calls[0][0].maxAge).toBe(0);
  });

  it("hands the shaped account over so the legacy fallback syncs the real derivation", async () => {
    await runSync();
    expect(rememberMock).toHaveBeenCalledWith(account);
  });

  it("emits an updater that applies the resolved balance", async () => {
    const updater = await runSync();
    const updated = updater(account);
    expect(updated.balance.toFixed()).toBe("1500");
    expect(updated.spendableBalance.toFixed()).toBe("1400");
    expect(updated.lastSyncDate.getTime()).toBeGreaterThan(0);
  });

  it("leaves the rest of the account untouched", async () => {
    const updater = await runSync();
    const updated = updater(account);
    expect(updated.id).toBe(ACCOUNT_ID);
    expect(updated.freshAddress).toBe("0xabc");
  });

  it("ignores rows belonging to token accounts when setting the account balance", async () => {
    rowsMock.mockReturnValue([row({ accountId: `${ACCOUNT_ID}+token`, balance: "9" }), row()]);
    const updated = (await runSync())(account);
    expect(updated.balance.toFixed()).toBe("1500");
  });

  it("fails when the slice errored, so the descriptor is recorded as non-imported", async () => {
    const boom = new Error("chain unreachable");
    getStatusMock.mockReturnValue({ pending: false, error: boom });
    await expect(runSync()).rejects.toThrow("chain unreachable");
  });

  it("fails when no source could produce a balance", async () => {
    rowsMock.mockReturnValue([]);
    await expect(runSync()).rejects.toThrow(`no balance could be resolved for ${ACCOUNT_ID}`);
  });

  it("throws on any other bridge capability rather than pretending to support it", () => {
    const bridge = balanceOnlyAccountBridge();
    expect(() => bridge.broadcast({ account, signedOperation: {} as never })).toThrow(
      "balanceOnlyAccountBridge does not implement broadcast",
    );
  });
});
