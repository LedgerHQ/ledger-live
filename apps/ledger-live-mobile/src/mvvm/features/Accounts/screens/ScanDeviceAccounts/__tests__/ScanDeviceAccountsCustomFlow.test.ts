import BigNumber from "bignumber.js";
import { of, EMPTY } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { renderHook, waitFor } from "@tests/test-renderer";
import { setupScanDeviceTests } from "./shared";
import useScanDeviceAccountsViewModel from "../useScanDeviceAccountsViewModel";
import { track } from "~/analytics";

const mockOnImportAccounts = jest.fn();
const mockOnScanDeviceAccountsBack = jest.fn();

jest.mock("LLM/features/Accounts/utils/customAddAccountFlow", () => ({
  getCustomAddAccountFlow: jest.fn(() => ({
    onImportAccounts: mockOnImportAccounts,
    onScanDeviceAccountsBack: mockOnScanDeviceAccountsBack,
    scanDeviceAccountsCtaI18nKey: "aleo.addAccount.stepScanAccounts.cta.shareViewKeys",
  })),
}));

jest.mock("~/analytics", () => ({
  track: jest.fn(),
}));

const mockTrack = jest.mocked(track);

const analyticsMetadata = {
  AccountsFound: {
    onContinue: { eventName: "button_clicked", payload: { button: "Continue" } },
  },
  ScanDeviceAccounts: {
    onBack: { eventName: "button_clicked", payload: { button: "Back" } },
  },
};

const { replace, setRouteParams, setScanObservable, makeDiscoveredEvent, resetSpies } =
  setupScanDeviceTests();

const createAleoAccount = (overrides?: Partial<Account>): Account => {
  const balance = overrides?.balance ?? new BigNumber(0);
  return {
    type: "Account",
    id: overrides?.id ?? "js:2:aleo:addr1:aleo",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: overrides?.freshAddress ?? "aleo1abc",
    freshAddressPath: "44/7027",
    used: overrides?.used ?? false,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    blockHeight: 0,
    currency: getCryptoCurrencyById("aleo"),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    subAccounts: [],
    ...overrides,
  };
};

describe("ScanDeviceAccounts - customAddAccountFlow delegation", () => {
  beforeEach(() => {
    resetSpies();
    mockOnImportAccounts.mockClear();
    mockOnScanDeviceAccountsBack.mockClear();
    mockTrack.mockClear();
    setRouteParams("aleo");
    setScanObservable(EMPTY);
  });

  it("delegates to customFlow.onImportAccounts instead of dispatching addAccountsAction", async () => {
    const aleoAccount = createAleoAccount({ used: true, balance: new BigNumber(1000) });
    setScanObservable(of(makeDiscoveredEvent(aleoAccount)));

    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata,
      }),
    );

    await waitFor(() => expect(result.current.scannedAccounts).toHaveLength(1));

    result.current.onPressAccount(aleoAccount);
    await waitFor(() => expect(result.current.selectedIds).toContain(aleoAccount.id));

    result.current.importAccounts();

    expect(mockOnImportAccounts).toHaveBeenCalledTimes(1);
    expect(mockOnImportAccounts).toHaveBeenCalledWith(
      expect.objectContaining({
        accountsToAdd: [aleoAccount],
      }),
    );
    expect(replace).not.toHaveBeenCalled();

    // Delegating to the custom flow must not skip the AccountsFound.onContinue tracking
    // that the default import path emits.
    expect(mockTrack).toHaveBeenCalledWith(
      analyticsMetadata.AccountsFound.onContinue.eventName,
      analyticsMetadata.AccountsFound.onContinue.payload,
    );
    expect(mockTrack.mock.invocationCallOrder[0]).toBeLessThan(
      mockOnImportAccounts.mock.invocationCallOrder[0],
    );
  });

  it("exposes a scanDeviceAccountsBack callback that tracks ScanDeviceAccounts.onBack before delegating to the custom flow handler", async () => {
    const { result } = renderHook(() =>
      useScanDeviceAccountsViewModel({
        existingAccounts: [],
        blacklistedTokenIds: [],
        analyticsMetadata,
      }),
    );

    await waitFor(() => expect(result.current.scanDeviceAccountsBack).toBeInstanceOf(Function));
    result.current.scanDeviceAccountsBack?.();

    expect(mockOnScanDeviceAccountsBack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(
      analyticsMetadata.ScanDeviceAccounts.onBack.eventName,
      analyticsMetadata.ScanDeviceAccounts.onBack.payload,
    );
    expect(mockTrack.mock.invocationCallOrder[0]).toBeLessThan(
      mockOnScanDeviceAccountsBack.mock.invocationCallOrder[0],
    );
  });
});
