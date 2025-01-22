import { renderHook } from "@tests/test-renderer";
import useAnalytics from "../useAnalytics";
import {
  AnalyticContexts,
  AnalyticEvents,
  AnalyticButtons,
  AnalyticFlows,
  AnalyticPages,
} from "../useAnalytics/enums";
import { ScreenName } from "~/const";

const StaticAnalyticMetadata = {
  [ScreenName.AddAccountsSelectCrypto]: {
    onAccessScreen: {
      eventName: AnalyticEvents.SelectAsset,
      payload: {
        source: "fakeSourceScreenName",
        flow: AnalyticFlows.AddAccount,
      },
    },
    onAssetClick: {
      eventName: AnalyticEvents.AssetClicked,
      payload: {
        page: AnalyticPages.AddAccountSelectAsset,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onAssetSearch: {
      eventName: AnalyticEvents.AssetSearched,
      payload: {
        page: AnalyticPages.AddAccountSelectAsset,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onBack: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Back,
        page: AnalyticPages.AddAccountSelectAsset,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onClose: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Close,
        page: AnalyticPages.AddAccountSelectAsset,
        flow: AnalyticFlows.AddAccount,
      },
    },
  },
  [ScreenName.SelectNetwork]: {
    onAccessScreen: {
      eventName: AnalyticEvents.SelectNetwork,
      payload: {
        source: "fakeSourceScreenName",
        flow: AnalyticFlows.AddAccount,
      },
    },
    onNetworkClick: {
      eventName: AnalyticEvents.NetworkClicked,
      payload: {
        page: AnalyticPages.AddAccountSelectNetwork,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onBack: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Back,
        page: AnalyticPages.AddAccountSelectNetwork,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onClose: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Close,
        page: AnalyticPages.AddAccountSelectNetwork,
        flow: AnalyticFlows.AddAccount,
      },
    },
  },
  [ScreenName.ScanDeviceAccounts]: {
    onAccessScreen: {
      eventName: AnalyticEvents.AccountLookup,
      payload: {
        source: "fakeSourceScreenName",
        flow: AnalyticFlows.AddAccount,
      },
    },
    onStopScan: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.StopScanning,
        page: AnalyticPages.AccountsFound,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onBack: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Back,
        page: AnalyticPages.AccountsFound,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onClose: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Close,
        page: AnalyticPages.AccountsFound,
        flow: AnalyticFlows.AddAccount,
      },
    },
  },
  AccountsFound: {
    onAccessScreen: {
      eventName: AnalyticPages.AccountsFound,
      payload: {
        source: "fakeSourceScreenName",
        flow: AnalyticFlows.AddAccount,
      },
    },
    onBack: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Back,
        page: AnalyticPages.AccountsFound,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onClose: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Close,
        page: AnalyticPages.AccountsFound,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onSelectAll: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.SelectAll,
        page: AnalyticPages.AccountsFound,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onContinue: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Continue,
        page: AnalyticPages.AccountsFound,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onAccountsAdded: {
      eventName: AnalyticEvents.AccountAdded,
      payload: {
        flow: AnalyticFlows.AddAccount,
      },
    },
  },
  AddFunds: {
    onOpenDrawer: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.FundMyAccount,
        page: AnalyticPages.AddAccountSuccess,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onAccessScreen: {
      eventName: AnalyticPages.FundAccountDrawerList,
      payload: {
        source: "fakeSourceScreenName",
        flow: AnalyticFlows.AddAccount,
      },
    },
    onSelectAccount: {
      eventName: AnalyticEvents.AccountClicked,
      payload: {
        page: AnalyticPages.FundAccountDrawerList,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onCloseDrawer: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Close,
        page: AnalyticPages.FundAccountDrawerList,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onQuickActionOpen: {
      eventName: AnalyticEvents.FundingQuickAction,
      payload: {
        source: "fakeSourceScreenName",
        flow: AnalyticFlows.AddAccount,
      },
    },
    onQuickActionClose: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Close,
        page: AnalyticEvents.FundingQuickAction,
      },
    },
  },
  [ScreenName.AddAccountsSuccess]: {
    onClose: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Close,
        page: AnalyticPages.AddAccountSuccess,
        flow: AnalyticFlows.AddAccount,
      },
    },
  },
};

describe("useAnalytics", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useAnalytics(AnalyticContexts.ReceiveFunds));
    expect(result.current.analyticsMetadata).toEqual({});
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() =>
      useAnalytics(AnalyticContexts.AddAccounts, "fakeSourceScreenName"),
    );
    expect(result.current.analyticsMetadata).toEqual(StaticAnalyticMetadata);
  });
});
