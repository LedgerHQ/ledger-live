// @flow
import React from "react";
import { StyleSheet, StatusBar, Platform } from "react-native";
import {
  createStackNavigator,
  createBottomTabNavigator,
  createMaterialTopTabNavigator,
} from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import colors from "./colors";
import SettingsIcon from "./icons/Settings";
import ManagerIcon from "./icons/Manager";
import AccountsIcon from "./icons/Accounts";
import HeaderTitle from "./components/HeaderTitle";
import HeaderRightClose from "./components/HeaderRightClose";
import { getFontStyle } from "./components/LText";
import HeaderBackImage from "./components/HeaderBackImage";
import defaultNavigationOptions from "./screens/defaultNavigationOptions";
import Portfolio from "./screens/Portfolio";
import Accounts from "./screens/Accounts";
import Account from "./screens/Account";
import Settings from "./screens/Settings";
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
import ReceiveConfirmation from "./screens/ReceiveFunds/04-Confirmation";
import SendFundsMain from "./screens/SendFunds/01-SelectAccount";
import SendSelectRecipient from "./screens/SendFunds/02-SelectRecipient";
import ScanRecipient from "./screens/SendFunds/ScanRecipient";
import SendAmount from "./screens/SendFunds/03-Amount";
import SendSummary from "./screens/SendFunds/04-Summary";
import SendConnectDevice from "./screens/SendFunds/05-ConnectDevice";
import SendValidation from "./screens/SendFunds/06-Validation";
import OperationDetails from "./screens/OperationDetails";
import Transfer from "./screens/Transfer";
import AccountSettingsMain from "./screens/AccountSettings";
import EditAccountUnits from "./screens/AccountSettings/EditAccountUnits";
import EditAccountName from "./screens/AccountSettings/EditAccountName";
import ScanAccounts from "./screens/ImportAccounts/Scan";
import DisplayResult from "./screens/ImportAccounts/DisplayResult";
import EditFees from "./screens/EditFees";
import FallBackCameraScreen from "./screens/ImportAccounts/FallBackCameraScreen";
import DebugBLE from "./screens/DebugBLE";
import DebugCrash from "./screens/DebugCrash";
import BenchmarkQRStream from "./screens/BenchmarkQRStream";
import EditDeviceName from "./screens/EditDeviceName";
import PairDevices from "./screens/PairDevices";

// add accounts
import AddAccountsHeaderRightClose from "./screens/AddAccounts/AddAccountsHeaderRightClose";
import AddAccountsSelectCrypto from "./screens/AddAccounts/01-SelectCrypto";
import AddAccountsSelectDevice from "./screens/AddAccounts/02-SelectDevice";
import AddAccountsAccounts from "./screens/AddAccounts/03-Accounts";
import AddAccountsSuccess from "./screens/AddAccounts/04-Success";

// TODO look into all FlowFixMe

let headerStyle;

if (Platform.OS === "ios") {
  headerStyle = {
    height: 48,
    borderBottomWidth: 0,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      height: 4,
    },
  };
} else {
  const statusBarPadding = StatusBar.currentHeight;

  headerStyle = {
    height: 48 + statusBarPadding,
    paddingTop: statusBarPadding,
    elevation: 4,
  };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.lightGrey,
  },
  header: {
    backgroundColor: colors.white,
    ...headerStyle,
  },
  bottomTabBar: {
    height: 48,
    borderTopColor: colors.lightFog,
    backgroundColor: colors.white,
  },
  transparentHeader: {
    backgroundColor: "transparent",
  },
  labelStyle: { fontSize: 12 },
});

const navigationOptions = {
  headerStyle: styles.header,
  headerTitle: HeaderTitle,
  headerBackTitle: null,
  headerBackImage: HeaderBackImage,
};

const closableNavigationOptions = ({
  navigation,
}: {
  navigation: NavigationScreenProp<*>,
}) => ({
  ...navigationOptions,
  headerRight: <HeaderRightClose navigation={navigation} />,
});

const stackNavigatorConfig = {
  navigationOptions,
  cardStyle: styles.card,
  headerLayoutPreset: "center",
};

const closableStackNavigatorConfig = {
  ...stackNavigatorConfig,
  navigationOptions: closableNavigationOptions,
};

const TransparentHeaderNavigationOptions = {
  headerTransparent: true,
  headerStyle: [styles.header, styles.transparentHeader],
  headerTitle: (props: *) => (
    <HeaderTitle {...props} style={{ color: colors.white }} />
  ),
};

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
    BenchmarkQRStream,
  },
  stackNavigatorConfig,
);

SettingsStack.navigationOptions = {
  ...defaultNavigationOptions,
  tabBarIcon: ({ tintColor }: *) => (
    <SettingsIcon size={18} color={tintColor} />
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
  stackNavigatorConfig,
);

ManagerStack.navigationOptions = {
  ...defaultNavigationOptions,
  tabBarIcon: ({ tintColor }: *) => <ManagerIcon size={18} color={tintColor} />,
};

const AccountsStack = createStackNavigator(
  {
    Accounts,
    Account,
  },
  stackNavigatorConfig,
);
AccountsStack.navigationOptions = {
  ...defaultNavigationOptions,
  header: null,
  tabBarIcon: ({ tintColor }: *) => (
    <AccountsIcon size={18} color={tintColor} />
  ),
};

const getTabItems = () => {
  const items: any = {
    Portfolio,
    Accounts: AccountsStack,
    Transfer,
    Manager: ManagerStack,
    Settings: SettingsStack,
  };
  return items;
};

const Main = createBottomTabNavigator(getTabItems(), {
  tabBarOptions: {
    style: styles.bottomTabBar,
  },
});

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
  },
  closableStackNavigatorConfig,
);

SendFunds.navigationOptions = {
  header: null,
};

const SendFundsSettings = createStackNavigator(
  {
    EditFees,
  },
  closableStackNavigatorConfig,
);

SendFundsSettings.navigationOptions = {
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

const ImportAccounts = createStackNavigator(
  {
    ScanAccounts: {
      screen: ScanAccounts,
      navigationOptions: TransparentHeaderNavigationOptions,
    },
    DisplayResult,
    FallBackCameraScreen,
  },
  closableStackNavigatorConfig,
);

ImportAccounts.navigationOptions = {
  header: null,
};

export const RootNavigator = createStackNavigator(
  {
    Main,
    ReceiveFunds,
    SendFunds,
    AddAccounts,
    // $FlowFixMe
    OperationDetails,
    AccountSettings,
    ImportAccounts,
    SendFundsSettings,
    PairDevices,
    // $FlowFixMe non-sense error
    EditDeviceName,
  },
  {
    mode: "modal",
    ...closableStackNavigatorConfig,
  },
);
