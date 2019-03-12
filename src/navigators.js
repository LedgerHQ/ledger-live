// @flow
import React from "react";
import {
  createStackNavigator,
  createMaterialTopTabNavigator,
  createSwitchNavigator,
  createAppContainer,
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
  defaultNavigationOptions,
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
import DebugStore from "./screens/DebugStore";
import DebugWSImport from "./screens/DebugWSImport";
import ScanAccounts from "./screens/ImportAccounts/Scan";
import DisplayResult from "./screens/ImportAccounts/DisplayResult";
import FallBackCameraScreen from "./screens/ImportAccounts/FallBackCameraScreen.ios";
import OnboardingOrNavigator from "./screens/OnboardingOrNavigator";
import AdvancedLogs from "./screens/AccountSettings/AdvancedLogs";

// TODO look into all FlowFixMe

const SettingsStack = createStackNavigator(
  {
    Settings,
    CountervalueSettings,
    RateProviderSettings,
    GeneralSettings,
    AboutSettings,
    HelpSettings,
    CurrenciesList,
    CurrencySettings,
    RepairDevice,
    // $FlowFixMe
    DebugSettings,
    // $FlowFixMe
    DebugDevices,
    DebugMocks,
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
    AdvancedLogs,
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
    OperationDetails,
    AccountSettings,
    ImportAccounts,
    PairDevices,
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
  OnboardingStepChooseDevice,
  OnboardingStepGetStarted,
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

const RootNavigator = createSwitchNavigator({
  OnboardingOrNavigator,
  BaseNavigator,
  BaseOnboarding,
});

RootNavigator.navigationOptions = { header: null };

const AppContainer = createAppContainer(RootNavigator);
export default AppContainer;
