// @flow
import React from "react";
import {
  createStackNavigator,
  createBottomTabNavigator,
  createMaterialTopTabNavigator,
  createSwitchNavigator,
} from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import colors from "./colors";
import PortfolioIcon from "./icons/Portfolio";
import SettingsIcon from "./icons/Settings";
import ManagerIcon from "./icons/Manager";
import AccountsIcon from "./icons/Accounts";
import { getFontStyle } from "./components/LText";
import TabIcon from "./components/TabIcon";
import Portfolio from "./screens/Portfolio";
import Accounts from "./screens/Accounts";
import Account from "./screens/Account";
import Settings from "./screens/Settings";
import Onboarding from "./screens/Onboarding";
import CountervalueSettings from "./screens/Settings/General/CountervalueSettings";
import RateProviderSettings from "./screens/Settings/General/RateProviderSettings";
import GeneralSettings from "./screens/Settings/General";
import AboutSettings from "./screens/Settings/About";
import HelpSettings from "./screens/Settings/Help";
import DebugSettings from "./screens/Settings/Debug";
import CurrencySettings from "./screens/Settings/Currencies/CurrencySettings";
import CurrenciesList from "./screens/Settings/Currencies/CurrenciesList";
import Manager from "./screens/Manager";
import ManagerAppsList from "./screens/Manager/AppsList";
import ManagerDevice from "./screens/Manager/Device";
import ReceiveSelectAccount from "./screens/ReceiveFunds/01-SelectAccount";
import ReceiveConnectDevice from "./screens/ReceiveFunds/02-ConnectDevice";
import ReceiveConfirmation from "./screens/ReceiveFunds/03-Confirmation";
import SendFundsMain from "./screens/SendFunds/01-SelectAccount";
import FallbackCameraSend from "./screens/SendFunds/FallbackCamera/FallbackCameraSend";
import SendSelectRecipient from "./screens/SendFunds/02-SelectRecipient";
import ScanRecipient from "./screens/SendFunds/ScanRecipient";
import SendAmount from "./screens/SendFunds/03-Amount";
import SendSummary from "./screens/SendFunds/04-Summary";
import SendConnectDevice from "./screens/SendFunds/05-ConnectDevice";
import SendValidation from "./screens/SendFunds/06-Validation";
import SendValidationSuccess from "./screens/SendFunds/07-ValidationSuccess";
import SendValidationError from "./screens/SendFunds/07-ValidationError";
import FirmwareUpdateReleaseNotes from "./screens/FirmwareUpdate/01-ReleaseNotes";
import FirmwareUpdateCheckId from "./screens/FirmwareUpdate/02-CheckId";
import FirmwareUpdateMCU from "./screens/FirmwareUpdate/03-MCU";
import FirmwareUpdateConfirmation from "./screens/FirmwareUpdate/04-Confirmation";
import FirmwareUpdateFailure from "./screens/FirmwareUpdate/04-Failure";
import OperationDetails from "./screens/OperationDetails";
import Transfer from "./screens/Transfer";
import AccountSettingsMain from "./screens/AccountSettings";
import EditAccountUnits from "./screens/AccountSettings/EditAccountUnits";
import EditAccountName from "./screens/AccountSettings/EditAccountName";
import DebugBLE from "./screens/DebugBLE";
import DebugCrash from "./screens/DebugCrash";
import DebugHttpTransport from "./screens/DebugHttpTransport";
import DebugIcons from "./screens/DebugIcons";
import BenchmarkQRStream from "./screens/BenchmarkQRStream";
import EditDeviceName from "./screens/EditDeviceName";
import PairDevices from "./screens/PairDevices";
import ImportAccounts from "./screens/ImportAccounts/importAccountsNavigator";
import styles from "./navigation/styles";
import TransparentHeaderNavigationOptions from "./navigation/TransparentHeaderNavigationOptions";
import {
  stackNavigatorConfig,
  closableStackNavigatorConfig,
  navigationOptions,
} from "./navigation/navigatorConfig";

// add accounts
import AddAccountsHeaderRightClose from "./screens/AddAccounts/AddAccountsHeaderRightClose";
import AddAccountsSelectCrypto from "./screens/AddAccounts/01-SelectCrypto";
import AddAccountsSelectDevice from "./screens/AddAccounts/02-SelectDevice";
import AddAccountsAccounts from "./screens/AddAccounts/03-Accounts";
import AddAccountsSuccess from "./screens/AddAccounts/04-Success";

import sendScreens from "./families/sendScreens";
import PasswordAdd from "./screens/Settings/General/PasswordAdd";

// TODO look into all FlowFixMe

const SettingsStack = createStackNavigator(
  {
    Settings,
    CountervalueSettings,
    RateProviderSettings,
    // $FlowFixMe
    GeneralSettings,
    // $FlowFixMe
    AboutSettings,
    // $FlowFixMe
    HelpSettings,
    CurrenciesList,
    CurrencySettings,
    // $FlowFixMe
    DebugSettings,
    // $FlowFixMe
    DebugBLE,
    // $FlowFixMe
    DebugCrash,
    // $FlowFixMe
    DebugHttpTransport,
    // $FlowFixMe
    DebugIcons,
    // $FlowFixMe
    BenchmarkQRStream,
  },
  stackNavigatorConfig,
);

SettingsStack.navigationOptions = {
  tabBarIcon: (props: *) => (
    <TabIcon Icon={SettingsIcon} i18nKey="tabs.settings" {...props} />
  ),
};

const ManagerMain = createMaterialTopTabNavigator(
  {
    // $FlowFixMe
    ManagerAppsList,
    // $FlowFixMe
    ManagerDevice,
  },
  {
    tabBarOptions: {
      activeTintColor: colors.live,
      inactiveTintColor: colors.grey,
      upperCaseLabel: false,
      labelStyle: {
        fontSize: 14,
        ...getFontStyle({
          semiBold: true,
        }),
      },
      style: {
        backgroundColor: colors.white,
      },
      indicatorStyle: {
        backgroundColor: colors.live,
      },
    },
  },
);

ManagerMain.navigationOptions = {
  title: "Manager",
};

const ManagerStack = createStackNavigator(
  {
    // $FlowFixMe
    Manager,
    // $FlowFixMe
    ManagerMain,
  },
  {
    ...stackNavigatorConfig,
    navigationOptions: {
      ...stackNavigatorConfig.navigationOptions,
      headerStyle: styles.headerNoShadow,
    },
  },
);

ManagerStack.navigationOptions = {
  tabBarIcon: (props: *) => (
    <TabIcon Icon={ManagerIcon} i18nKey="tabs.manager" {...props} />
  ),
};

const AccountsStack = createStackNavigator(
  {
    Accounts,
    Account,
  },
  stackNavigatorConfig,
);
AccountsStack.navigationOptions = {
  header: null,
  tabBarIcon: (props: *) => (
    <TabIcon Icon={AccountsIcon} i18nKey="tabs.accounts" {...props} />
  ),
};

const Main = createBottomTabNavigator(
  {
    Portfolio: {
      screen: Portfolio,
      navigationOptions: {
        tabBarIcon: (props: *) => (
          <TabIcon Icon={PortfolioIcon} i18nKey="tabs.portfolio" {...props} />
        ),
      },
    },
    AccountsStack,
    // $FlowFixMe
    Transfer,
    ManagerStack,
    SettingsStack,
  },
  {
    tabBarOptions: {
      style: styles.bottomTabBar,
      showLabel: false,
    },
  },
);

Main.navigationOptions = {
  header: null,
};

const ReceiveFunds = createStackNavigator(
  {
    ReceiveSelectAccount,
    ReceiveConnectDevice,
    ReceiveConfirmation,
  },
  {
    headerMode: "float",
    ...closableStackNavigatorConfig,
  },
);
ReceiveFunds.navigationOptions = {
  header: null,
};

const addAccountsNavigatorConfig = {
  ...closableStackNavigatorConfig,
  headerMode: "float",
  navigationOptions: ({
    navigation,
  }: {
    navigation: NavigationScreenProp<*>,
  }) => ({
    ...navigationOptions,
    headerRight: <AddAccountsHeaderRightClose navigation={navigation} />,
  }),
};

const AddAccounts = createStackNavigator(
  {
    AddAccountsSelectCrypto,
    AddAccountsSelectDevice,
    AddAccountsAccounts,
    AddAccountsSuccess,
  },
  addAccountsNavigatorConfig,
);

AddAccounts.navigationOptions = {
  header: null,
};

const SendFunds = createStackNavigator(
  {
    SendFundsMain,
    SendSelectRecipient,
    ScanRecipient: {
      screen: ScanRecipient,
      navigationOptions: TransparentHeaderNavigationOptions,
    },
    SendAmount,
    SendSummary,
    SendConnectDevice,
    SendValidation,
    SendValidationSuccess,
    SendValidationError,
    FallbackCameraSend,
    ...sendScreens,
  },
  closableStackNavigatorConfig,
);

SendFunds.navigationOptions = {
  header: null,
};

const FirmwareUpdate = createStackNavigator(
  {
    FirmwareUpdateReleaseNotes,
    FirmwareUpdateCheckId,
    FirmwareUpdateMCU,
    FirmwareUpdateConfirmation,
    FirmwareUpdateFailure,
  },
  closableStackNavigatorConfig,
);

FirmwareUpdate.navigationOptions = {
  header: null,
};

const AccountSettings = createStackNavigator(
  {
    AccountSettingsMain,
    EditAccountUnits,
    EditAccountName,
    AccountCurrencySettings: CurrencySettings,
    AccountRateProviderSettings: RateProviderSettings,
  },
  closableStackNavigatorConfig,
);

AccountSettings.navigationOptions = {
  header: null,
};

const BaseNavigator = createStackNavigator(
  {
    Main,
    ReceiveFunds,
    SendFunds,
    AddAccounts,
    FirmwareUpdate,
    // $FlowFixMe
    OperationDetails,
    AccountSettings,
    ImportAccounts,
    PairDevices,
    // $FlowFixMe non-sense error
    EditDeviceName,
    PasswordAdd,
  },
  {
    mode: "modal",
    ...closableStackNavigatorConfig,
  },
);

export const RootNavigator = createSwitchNavigator({
  BaseNavigator,
  Onboarding,
});

RootNavigator.navigationOptions = { header: null };
