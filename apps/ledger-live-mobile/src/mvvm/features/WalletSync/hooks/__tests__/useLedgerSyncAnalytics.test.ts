import { renderHook } from "@tests/test-renderer";
import { CONTACTS_FLOW } from "@features/flow-contacts";
import { INITIAL_STATE as WALLET_SYNC_INITIAL_STATE } from "~/reducers/walletSync";
import {
  AnalyticsButton,
  AnalyticsFlow,
  AnalyticsPage,
  useLedgerSyncAnalytics,
  useWalletSyncTrackingFlow,
} from "../useLedgerSyncAnalytics";

const mockedTrack = jest.fn();

jest.mock("~/analytics", () => ({
  track: (...args: unknown[]) => mockedTrack(...args),
}));

function renderTrackingFlow(returnsToEntryScreen: boolean) {
  return renderHook(() => useWalletSyncTrackingFlow(), {
    overrideInitialState: state => ({
      ...state,
      walletSync: { ...WALLET_SYNC_INITIAL_STATE, returnsToEntryScreen },
    }),
  });
}

describe("useWalletSyncTrackingFlow", () => {
  it("should use the Ledger Sync flow by default", () => {
    const { result } = renderTrackingFlow(false);

    expect(result.current).toBe(AnalyticsFlow.LedgerSync);
  });

  it("should use the contacts flow when opened from Contacts", () => {
    const { result } = renderTrackingFlow(true);

    expect(result.current).toBe(CONTACTS_FLOW.CONTACTS);
  });
});

describe("useLedgerSyncAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should attach the derived Wallet Sync flow when hasFlow is true", () => {
    mockedTrack.mockClear();
    const { result } = renderHook(() => useLedgerSyncAnalytics(), {
      overrideInitialState: state => ({
        ...state,
        walletSync: { ...WALLET_SYNC_INITIAL_STATE, returnsToEntryScreen: true },
      }),
    });

    result.current.onClickTrack({
      button: AnalyticsButton.SyncYourAccounts,
      page: AnalyticsPage.ActivateLedgerSync,
      hasFlow: true,
    });

    expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Turn on Ledger Sync",
      page: "Activate Ledger Sync",
      flow: CONTACTS_FLOW.CONTACTS,
    });
  });
});
