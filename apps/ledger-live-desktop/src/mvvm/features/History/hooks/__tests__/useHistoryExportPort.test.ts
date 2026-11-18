import { renderHook, act } from "tests/testSetup";
import { AccountIdSchema } from "@domain/entity-account";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { files } from "~/renderer/bridge";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { bitcoinCurrency, ethereumCurrency } from "../../../__mocks__/useSelectAssetFlow.mock";
import { useHistoryExportPort } from "../useHistoryExportPort";

const mockedExportOperations = jest.mocked(files.exportOperations);

const BTC_ACCOUNT = genAccount("history-export-btc", {
  currency: bitcoinCurrency,
  operationsSize: 1,
});
const ETH_ACCOUNT = genAccount("history-export-eth", {
  currency: ethereumCurrency,
  operationsSize: 1,
});

function renderPort(settings = {}) {
  return renderHook(() => useHistoryExportPort(), {
    initialState: {
      accounts: [BTC_ACCOUNT, ETH_ACCOUNT],
      settings: { ...AFTER_ONBOARDING_STATE, ...settings },
    },
  });
}

describe("useHistoryExportPort", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedExportOperations.mockResolvedValue("saved");
  });

  it("lists the accounts with their currency and a balance with its code", () => {
    const { result } = renderPort();

    expect(result.current.accounts.map(({ id, currency }) => ({ id, currency }))).toEqual([
      { id: BTC_ACCOUNT.id, currency: { id: "bitcoin", ticker: "BTC" } },
      { id: ETH_ACCOUNT.id, currency: { id: "ethereum", ticker: "ETH" } },
    ]);
    expect(result.current.accounts[0].name).toEqual(expect.any(String));
    expect(result.current.accounts[0].formattedBalance).toMatch(/BTC$/);
  });

  it("hides the balances in discreet mode", () => {
    const { result } = renderPort({ discreetMode: true });

    expect(result.current.accounts[0].formattedBalance).toContain("***");
  });

  it("exports only the requested accounts and returns the save outcome", async () => {
    mockedExportOperations.mockResolvedValue("canceled");
    const { result } = renderPort();

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.exportCsv([AccountIdSchema.parse(ETH_ACCOUNT.id)]);
    });

    expect(outcome).toBe("canceled");
    const csv = mockedExportOperations.mock.calls[0][1];
    expect(csv).toContain(",ETH,");
    expect(csv).not.toContain(",BTC,");
  });

  it("reports the requested accounts as not syncing when no sync is pending", () => {
    const { result } = renderPort();

    expect(result.current.isSyncing([AccountIdSchema.parse(BTC_ACCOUNT.id)])).toBe(false);
  });
});
