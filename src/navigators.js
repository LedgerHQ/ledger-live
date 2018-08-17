// @flow
import React from "react";
import { StyleSheet } from "react-native";
import {
  createBottomTabNavigator,
  createStackNavigator,
} from "react-navigation";
import colors from "./colors";
import SettingsIcon from "./images/icons/Settings";
import ManagerIcon from "./images/icons/Manager";
import Portfolio from "./screens/Portfolio";
import Accounts from "./screens/Accounts";
import Account from "./screens/Account";
import Settings from "./screens/Settings";
import CountervalueSettings from "./screens/Settings/General/CountervalueSettings";
import RateProviderSettings from "./screens/Settings/General/RateProviderSettings";
import GeneralSettings from "./screens/Settings/General";
import AboutSettings from "./screens/Settings/About";
import HelpSettings from "./screens/Settings/Help";
import CurrenciesSettings from "./screens/Settings/Currencies";
import Manager from "./screens/Manager";
import ReceiveFundsMain from "./screens/ReceiveFunds";
import SendFundsMain from "./screens/SendFunds";
import OperationDetails from "./screens/OperationDetails";
import Transfer from "./screens/Transfer";

const stackNavigatiorDefaultNavigationOptions = {
  headerStyle: {
    backgroundColor: "white",
    borderBottomWidth: 0,
  },
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.lightGrey,
  },
});

const SettingsStack = createStackNavigator(
  {
    // $FlowFixMe
    Settings,
    CountervalueSettings,
    RateProviderSettings,
    GeneralSettings,
    // $FlowFixMe
    AboutSettings,
    HelpSettings,
    CurrenciesSettings,
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card,
  },
);

SettingsStack.navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => (
    <SettingsIcon size={18} color={tintColor} />
  ),
};

const ManagerStack = createStackNavigator(
  {
    // $FlowFixMe
    Manager,
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card,
  },
);

ManagerStack.navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => <ManagerIcon size={18} color={tintColor} />,
};

const AccountsStack = createStackNavigator(
  {
    Accounts,
    Account,
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card,
  },
);
AccountsStack.navigationOptions = {
  header: null,
  tabBarIcon: ({ tintColor }: *) => (
    <Image
      source={require("./images/accounts.png")}
      style={{ tintColor, width: 32, height: 32 }}
    />
  ),
};

const Main = createBottomTabNavigator({
  // $FlowFixMe
  Portfolio,
  // $FlowFixMe
  Accounts: AccountsStack,
  // $FlowFixMe
  Transfer,
  Manager: ManagerStack,
  Settings: SettingsStack,
});

Main.navigationOptions = {
  header: null,
};

const ReceiveFunds = createStackNavigator(
  {
    ReceiveFundsMain,
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card,
  },
);
ReceiveFunds.navigationOptions = {
  header: null,
};

const SendFunds = createStackNavigator(
  {
    SendFundsMain,
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card,
  },
);
SendFunds.navigationOptions = {
  header: null,
};

export const RootNavigator = createStackNavigator(
  {
    Main,
    ReceiveFunds,
    SendFunds,
    OperationDetails,
  },
  {
    mode: "modal",
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card,
  },
);
