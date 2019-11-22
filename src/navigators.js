// @flow
import React from "react";
import i18next from "i18next";
import { createSwitchNavigator, createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import {
  createBottomTabNavigator,
  createMaterialTopTabNavigator,
} from "react-navigation-tabs";
import type { NavigationScreenProp } from "react-navigation";
import { Platform } from "react-native";
import PortfolioIcon from "./icons/Portfolio";
import SettingsIcon from "./icons/Settings";
import ManagerIcon from "./icons/Manager";
import AccountsIcon from "./icons/Accounts";
import NanoXIcon from "./icons/TabNanoX";

import TabIcon from "./components/TabIcon";
import Portfolio from "./screens/Portfolio";
import Manager from "./screens/Manager";
import Accounts from "./screens/Accounts";
import Account from "./screens/Account";
import Settings from "./screens/Settings";
import Asset from "./screens/Asset";
import MigrateAccountsOverview from "./screens/MigrateAccounts/01-Overview";
import MigrateAccountsConnectDevice from "./screens/MigrateAccounts/02-ConnectDevice";
import MigrateAccountsProgress from "./screens/MigrateAccounts/03-Progress";
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
import PasswordAdd from "./screens/Settings/General/PasswordAdd";
import PasswordRemove from "./screens/Settings/General/PasswordRemove";
import ConfirmPassword from "./screens/Settings/General/ConfirmPassword";
import GeneralSettings from "./screens/Settings/General";
import AboutSettings from "./screens/Settings/About";
import HelpSettings from "./screens/Settings/Help";
import ExperimentalSettings from "./screens/Settings/Experimental";
import DebugSettings, {
  DebugDevices,
  DebugMocks,
} from "./screens/Settings/Debug";
import DebugExport from "./screens/Settings/Debug/ExportAccounts";
import CurrencySettings from "./screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import CurrenciesList from "./screens/Settings/CryptoAssets/Currencies/CurrenciesList";
import RatesList from "./screens/Settings/CryptoAssets/Rates/RatesList";
import RateProviderSettings from "./screens/Settings/CryptoAssets/Rates/RateProviderSettings";
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
import RepairDevice from "./screens/RepairDevice";
import DebugBLE from "./screens/DebugBLE";
import DebugBLEBenchmark from "./screens/DebugBLEBenchmark";
import DebugCrash from "./screens/DebugCrash";
import DebugHttpTransport from "./screens/DebugHttpTransport";
import DebugIcons from "./screens/DebugIcons";
import DebugLottie from "./screens/DebugLottie.js";
import DebugSVG from "./screens/DebugSVG";
import BenchmarkQRStream from "./screens/BenchmarkQRStream";
import EditDeviceName from "./screens/EditDeviceName";
import PairDevices from "./screens/PairDevices";
import styles from "./navigation/styles";
import TransparentHeaderNavigationOptions from "./navigation/TransparentHeaderNavigationOptions";
import {
  stackNavigatorConfig,
  closableStackNavigatorConfig,
  topTabNavigatorConfig,
  defaultNavigationOptions,
} from "./navigation/navigatorConfig";

// add accounts
import AddAccountsHeaderRightClose from "./screens/AddAccounts/AddAccountsHeaderRightClose";
import AddAccountsSelectCrypto from "./screens/AddAccounts/01-SelectCrypto";
import AddAccountsSelectDevice from "./screens/AddAccounts/02-SelectDevice";
import AddAccountsTokenCurrencyDisclaimer from "./screens/AddAccounts/02-TokenCurrencyDisclaimer";
import AddAccountsAccounts from "./screens/AddAccounts/03-Accounts";
import AddAccountsSuccess from "./screens/AddAccounts/04-Success";

import perFamilyScreens from "./generated/screens";
import ReadOnlyTab from "./components/ReadOnlyTab";
import HiddenTabBarIfKeyboardVisible from "./components/HiddenTabBarIfKeyboardVisible";
import DebugStore from "./screens/DebugStore";
import DebugWSImport from "./screens/DebugWSImport";
import ScanAccounts from "./screens/ImportAccounts/Scan";
import DisplayResult from "./screens/ImportAccounts/DisplayResult";
import FallBackCameraScreen from "./screens/ImportAccounts/FallBackCameraScreen";
import OnboardingOrNavigator from "./screens/OnboardingOrNavigator";
import AdvancedLogs from "./screens/AccountSettings/AdvancedLogs";
import Distribution from "./screens/Distribution";

// TODO look into all FlowFixMe

const CryptoAssetsSettings = createMaterialTopTabNavigator(
  {
    RatesList,
    CurrenciesList,
  },
  topTabNavigatorConfig,
);

CryptoAssetsSettings.navigationOptions = {
  title: i18next.t("settings.cryptoAssets.header"),
  headerStyle: styles.headerNoShadow,
};

const SettingsStack = createStackNavigator(
  {
    Settings,
    CountervalueSettings,
    // $FlowFixMe
    GeneralSettings,
    // $FlowFixMe
    AboutSettings,
    // $FlowFixMe
    HelpSettings,
    CryptoAssetsSettings,
    CurrencySettings,
    RateProviderSettings,
    // $FlowFixMe
    RepairDevice,
    // $FlowFixMe
    ExperimentalSettings,
    // $FlowFixMe
    DebugSettings,
    // $FlowFixMe
    DebugDevices,
    DebugMocks,
    DebugExport,
    DebugBLE,
    // $FlowFixMe
    DebugBLEBenchmark,
    // $FlowFixMe
    DebugCrash,
    DebugStore,
    DebugHttpTransport,
    // $FlowFixMe
    DebugIcons,
    // $FlowFixMe
    DebugLottie,
    // $FlowFixMe
    DebugSVG,
    // $FlowFixMe
    DebugWSImport,
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
    ManagerAppsList,
    ManagerDevice,
  },
  topTabNavigatorConfig,
);

ManagerMain.navigationOptions = {
  title: i18next.t("tabs.manager"),
  headerStyle: styles.headerNoShadow,
};

const ManagerStack = createStackNavigator(
  {
    // $FlowFixMe
    Manager,
    ManagerMain,
  },
  {
    ...stackNavigatorConfig,
    defaultNavigationOptions: {
      ...stackNavigatorConfig.defaultNavigationOptions,
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
    // $FlowFixMe
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
      // $FlowFixMe
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
    defaultNavigationOptions: {
      tabBarOnPress: ({ navigation, defaultHandler }) => {
        defaultHandler();
        navigation.emit("refocus");
      },
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
  defaultNavigationOptions: ({
    navigation,
  }: {
    navigation: NavigationScreenProp<*>,
  }) => ({
    ...defaultNavigationOptions,
    headerRight: <AddAccountsHeaderRightClose navigation={navigation} />,
  }),
};

const AddAccounts = createStackNavigator(
  {
    // $FlowFixMe
    AddAccountsSelectCrypto,
    // $FlowFixMe
    AddAccountsSelectDevice,
    // $FlowFixMe
    AddAccountsAccounts,
    // $FlowFixMe
    AddAccountsSuccess,
    EditAccountName,
    // $FlowFixMe
    AddAccountsTokenCurrencyDisclaimer,
  },
  addAccountsNavigatorConfig,
);

AddAccounts.navigationOptions = {
  header: null,
};

const SendFunds = createStackNavigator(
  {
    SendFundsMain,
    // $FlowFixMe
    SendSelectRecipient,
    // $FlowFixMe
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

const MigrateAccountsFlow = createStackNavigator(
  {
    MigrateAccountsOverview,
    MigrateAccountsConnectDevice,
    MigrateAccountsProgress,
  },
  closableStackNavigatorConfig,
);

MigrateAccountsFlow.navigationOptions = ({ navigation }) => ({
  header: null,
  gesturesEnabled:
    Platform.OS === "ios"
      ? navigation.getParam("allowNavigation", true)
      : false,
});

const FirmwareUpdate = createStackNavigator(
  {
    // $FlowFixMe
    FirmwareUpdateReleaseNotes,
    // $FlowFixMe
    FirmwareUpdateCheckId,
    // $FlowFixMe
    FirmwareUpdateMCU,
    // $FlowFixMe
    FirmwareUpdateConfirmation,
    // $FlowFixMe
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
    AdvancedLogs,
    AccountCurrencySettings: CurrencySettings,
  },
  closableStackNavigatorConfig,
);

AccountSettings.navigationOptions = {
  header: null,
};

const ImportAccounts = createStackNavigator(
  {
    ScanAccounts: {
      // $FlowFixMe
      screen: ScanAccounts,
      navigationOptions: TransparentHeaderNavigationOptions,
    },
    // $FlowFixMe
    DisplayResult,
    // $FlowFixMe
    FallBackCameraScreen,
  },
  closableStackNavigatorConfig,
);

ImportAccounts.navigationOptions = {
  header: null,
};

const PasswordAddFlow = createStackNavigator(
  {
    // $FlowFixMe
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

const sendScreens = {};
const baseScreens = {};

Object.values(perFamilyScreens).forEach(obj => {
  if (obj && obj.sendScreens) {
    Object.assign(sendScreens, obj.sendScreens);
  }
  if (obj && obj.baseScreens) {
    Object.assign(baseScreens, obj.baseScreens);
  }
});

const BaseNavigator = createStackNavigator(
  {
    Main,
    ReceiveFunds,
    SendFunds,
    AddAccounts,
    FirmwareUpdate,
    OperationDetails,
    AccountSettings,
    ImportAccounts,
    PairDevices,
    EditDeviceName,
    PasswordAddFlow,
    PasswordModifyFlow,
    MigrateAccountsFlow,
    // $FlowFixMe
    Distribution,
    Asset,
    ScanRecipient: {
      // $FlowFixMe
      screen: ScanRecipient,
      navigationOptions: TransparentHeaderNavigationOptions,
    },
    // $FlowFixMe
    FallbackCameraSend,
    ...sendScreens,
    ...baseScreens,
  },
  {
    mode: "modal",
    ...closableStackNavigatorConfig,
  },
);

const Onboarding = createStackNavigator({
  OnboardingStepChooseDevice,
  // $FlowFixMe
  OnboardingStepGetStarted,
  // $FlowFixMe
  OnboardingStepSetupPin,
  // $FlowFixMe
  OnboardingStepWriteRecovery,
  // $FlowFixMe
  OnboardingStepSecurityChecklist,
  // $FlowFixMe
  OnboardingStepPairNew,
  // $FlowFixMe
  OnboardingStepScanQR,
  // $FlowFixMe
  OnboardingStepPassword,
  // $FlowFixMe
  OnboardingStepShareData,
  // $FlowFixMe
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

const RootNavigator = createSwitchNavigator({
  OnboardingOrNavigator,
  BaseNavigator,
  BaseOnboarding,
});

RootNavigator.navigationOptions = { header: null };

// $FlowFixMe
const AppContainer = createAppContainer(RootNavigator);
export default AppContainer;
