// @flow
import React from "react";
import {
  createStackNavigator,
  createMaterialTopTabNavigator,
  createSwitchNavigator,
} from "react-navigation";
import { createBottomTabNavigator } from "react-navigation-tabs";
import type { NavigationScreenProp } from "react-navigation";
import { Platform } from "react-native";
import colors from "./colors";
import PortfolioIcon from "./icons/Portfolio";
import SettingsIcon from "./icons/Settings";
import ManagerIcon from "./icons/Manager";
import AccountsIcon from "./icons/Accounts";
import NanoXIcon from "./icons/TabNanoX";

import { getFontStyle } from "./components/LText";
import TabIcon from "./components/TabIcon";
import Portfolio from "./screens/Portfolio";
import Manager from "./screens/Manager";
import Accounts from "./screens/Accounts";
import Account from "./screens/Account";
import Settings from "./screens/Settings";
import OnboardingStepGetStarted from "./screens/Onboarding/steps/get-started";
import OnboardingStepChooseDevice from "./screens/Onboarding/steps/choose-device";
import OnboardingStepSetupPin from "./screens/Onboarding/steps/setup-pin";
import OnboardingStepWriteRecovery from "./screens/Onboarding/steps/write-recovery";
import OnboardingStepSecurityChecklist from "./screens/Onboarding/steps/security-checklist";
import OnboardingStepPairNew from "./screens/Onboarding/steps/pair-new";
import OnboardingStepPassword from "./screens/Onboarding/steps/password";
import OnboardingStepShareData from "./screens/Onboarding/steps/share-data";
import OnboardingStepScanQR from "./screens/Onboarding/steps/scan-qr";
import OnboardingStepFinish from "./screens/Onboarding/steps/finish";
import CountervalueSettings from "./screens/Settings/General/CountervalueSettings";
import RateProviderSettings from "./screens/Settings/General/RateProviderSettings";
import PasswordAdd from "./screens/Settings/General/PasswordAdd";
import PasswordRemove from "./screens/Settings/General/PasswordRemove";
import ConfirmPassword from "./screens/Settings/General/ConfirmPassword";
import GeneralSettings from "./screens/Settings/General";
import AboutSettings from "./screens/Settings/About";
import HelpSettings from "./screens/Settings/Help";
import DebugSettings, {
  DebugDevices,
  DebugMocks,
} from "./screens/Settings/Debug";
import CurrencySettings from "./screens/Settings/Currencies/CurrencySettings";
import CurrenciesList from "./screens/Settings/Currencies/CurrenciesList";
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
import EditAccountNode from "./screens/AccountSettings/EditAccountNode";
import RepairDevice from "./screens/RepairDevice";
import DebugBLE from "./screens/DebugBLE";
import DebugBLEBenchmark from "./screens/DebugBLEBenchmark";
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
import ReadOnlyTab from "./components/ReadOnlyTab";
import HiddenTabBarIfKeyboardVisible from "./components/HiddenTabBarIfKeyboardVisible";

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
    RepairDevice,
    // $FlowFixMe
    DebugSettings,
    // $FlowFixMe
    DebugDevices,
    // $FlowFixMe
    DebugMocks,
    // $FlowFixMe
    DebugBLE,
    // $FlowFixMe
    DebugBLEBenchmark,
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
        height: 48,
      },
      indicatorStyle: {
        backgroundColor: colors.live,
      },
    },
  },
);

ManagerMain.navigationOptions = {
  title: "Manager",
  headerStyle: styles.headerNoShadow,
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
      headerStyle: styles.header,
    },
  },
);

ManagerStack.navigationOptions = ({ navigation }) => ({
  tabBarIcon: (props: *) => (
    <ReadOnlyTab
      OnIcon={NanoXIcon}
      oni18nKey="tabs.nanoX"
      OffIcon={ManagerIcon}
      offi18nKey="tabs.manager"
      {...props}
    />
  ),
  tabBarVisible: !navigation.getParam("editMode"),
});

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
    tabBarComponent: HiddenTabBarIfKeyboardVisible,
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
ReceiveFunds.navigationOptions = ({ navigation }) => ({
  header: null,
  gesturesEnabled:
    Platform.OS === "ios"
      ? navigation.getParam("allowNavigation", true)
      : false,
});

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
    SendAmount,
    SendSummary,
    SendConnectDevice,
    SendValidation,
    SendValidationSuccess,
    SendValidationError,
  },
  closableStackNavigatorConfig,
);

SendFunds.navigationOptions = ({ navigation }) => ({
  header: null,
  gesturesEnabled:
    Platform.OS === "ios"
      ? navigation.getParam("allowNavigation", true)
      : false,
});

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
    EditAccountNode,
    AccountCurrencySettings: CurrencySettings,
    AccountRateProviderSettings: RateProviderSettings,
  },
  closableStackNavigatorConfig,
);

AccountSettings.navigationOptions = {
  header: null,
};

const PasswordAddFlow = createStackNavigator(
  {
    PasswordAdd,
    ConfirmPassword,
  },
  closableStackNavigatorConfig,
);

PasswordAddFlow.navigationOptions = {
  header: null,
};

const PasswordModifyFlow = createStackNavigator(
  {
    PasswordRemove,
  },
  closableStackNavigatorConfig,
);

PasswordModifyFlow.navigationOptions = {
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
    PasswordAddFlow,
    PasswordModifyFlow,
    ScanRecipient: {
      screen: ScanRecipient,
      navigationOptions: TransparentHeaderNavigationOptions,
    },
    FallbackCameraSend,
    ...sendScreens,
  },
  {
    mode: "modal",
    ...closableStackNavigatorConfig,
  },
);

const Onboarding = createStackNavigator({
  OnboardingStepGetStarted,
  OnboardingStepChooseDevice,
  OnboardingStepSetupPin,
  OnboardingStepWriteRecovery,
  OnboardingStepSecurityChecklist,
  OnboardingStepPairNew,
  OnboardingStepScanQR,
  OnboardingStepPassword,
  OnboardingStepShareData,
  OnboardingStepFinish,
});

Onboarding.navigationOptions = { header: null };

const BaseOnboarding = createStackNavigator(
  {
    Onboarding,
    ImportAccounts,
    PairDevices,
    EditDeviceName,
    PasswordAddFlow,
    PasswordModifyFlow,
  },
  {
    mode: "modal",
    ...closableStackNavigatorConfig,
  },
);

export const RootNavigator = createSwitchNavigator({
  BaseNavigator,
  BaseOnboarding,
});

RootNavigator.navigationOptions = { header: null };
