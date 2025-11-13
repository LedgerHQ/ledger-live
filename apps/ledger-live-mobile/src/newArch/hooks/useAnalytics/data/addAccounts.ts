import { ScreenName } from "~/const";
import { AnalyticButtons, AnalyticEvents, AnalyticFlows, AnalyticPages } from "../enums";

const getAddAccountsMetadata = (sourceScreenName?: string) => ({
  [ScreenName.ScanDeviceAccounts]: {
    onAccessScreen: {
      eventName: AnalyticEvents.AccountLookup,
      payload: {
        source: sourceScreenName,
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
        source: sourceScreenName,
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
        source: sourceScreenName,
      },
    },
    onAccessScreen: {
      eventName: AnalyticPages.FundAccountDrawerList,
      payload: {
        source: sourceScreenName,
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
        source: sourceScreenName,
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
    onSelectAccount: {
      eventName: AnalyticEvents.AccountClicked,
      payload: {
        page: AnalyticPages.AddAccountSuccess,
      },
    },
  },
  [ScreenName.AddAccountsWarning]: {
    onClose: {
      eventName: AnalyticEvents.ButtonClicked,
      payload: {
        button: AnalyticButtons.Close,
        page: AnalyticPages.AddAccountWarning,
        flow: AnalyticFlows.AddAccount,
      },
    },
    onSelectAccount: {
      eventName: AnalyticEvents.AccountClicked,
      payload: {
        page: AnalyticPages.AddAccountWarning,
      },
    },
  },
});

export default getAddAccountsMetadata;
