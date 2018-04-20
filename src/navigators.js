// @flow
import React, { Component } from "react";
import { StyleSheet, Image } from "react-native";
import { StackNavigator, TabNavigator, TabBarBottom } from "react-navigation";
import colors from "./colors";
import Dashboard from "./screens/Dashboard";
import Accounts from "./screens/Accounts";
import AccountSettings from "./screens/accountSettings/index";
import Search from "./screens/Search";
import Settings from "./screens/Settings";
import CurrenciesSettings from "./screens/CurrenciesSettings";
import Confirmations from "./screens/CurrenciesSettings/Confirmations";
import ConfirmationsToSpend from "./screens/CurrenciesSettings/ConfirmationsToSpend";
import BlockchainExplorer from "./screens/CurrenciesSettings/BlockchainExplorer";
import TransactionFees from "./screens/CurrenciesSettings/TransactionFees";
import SelectFiatUnit from "./screens/Settings/SelectFiatUnit";
import ChartTimeRange from "./screens/Settings/ChartTimeRange";
import ImportAccounts from "./screens/ImportAccounts";
import EditUnits from "./screens/accountSettings/EditUnits";
import EditName from "./screens/accountSettings/EditName";
import Create from "./screens/Create";
import ReceiveFundsMain from "./screens/ReceiveFunds";
import ReceiveFundsSelectAccount from "./screens/ReceiveFundsSelectAccount";
import SendFundsSelectAccount from "./screens/SendFundsSelectAccount";
import SendFundsChoseAmount from "./screens/SendFundsChoseAmount";
import SendFundsScanAddress from "./screens/SendFundsScanAddress";
import SendFundsChoseFee from "./screens/SendFundsChoseFee";
import SendFundsReview from "./screens/SendFundsReview";
import SendFundsPlugDevice from "./screens/SendFundsPlugDevice";
import SendFundsConfirmation from "./screens/SendFundsConfirmation";
import AddAccountSelectCurrency from "./screens/AddAccountSelectCurrency";
import AddAccountInfo from "./screens/AddAccountInfo";
import OperationDetails from "./screens/OperationDetails";

const stackNavigatiorDefaultNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.blue,
    borderBottomWidth: 0
  },
  headerTintColor: "white"
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.lightBackground
  }
});

const currencySettingsScreens = {
  ConfirmationsToSpend: { screen: ConfirmationsToSpend },
  Confirmations: { screen: Confirmations },
  TransactionFees: { screen: TransactionFees },
  BlockchainExplorer: { screen: BlockchainExplorer }
};

const SettingsStack = StackNavigator(
  {
    Settings: { screen: Settings },
    ImportAccounts: { screen: ImportAccounts },
    SelectFiatUnit: { screen: SelectFiatUnit },
    ChartTimeRange: { screen: ChartTimeRange },
    CurrenciesSettings: { screen: CurrenciesSettings },
    ...currencySettingsScreens
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card
  }
);

SettingsStack.navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => (
    <Image
      source={require("./images/settings.png")}
      style={{ tintColor, width: 32, height: 32 }}
    />
  )
};

const AccountSettingsStack = StackNavigator(
  {
    AccountSettings: { screen: AccountSettings },
    EditUnits: { screen: EditUnits },
    EditName: { screen: EditName },
    ...currencySettingsScreens
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card
  }
);

class AccountSettingsConfig extends Component<*> {
  static navigationOptions = {
    header: null
  };
  render() {
    const { navigation } = this.props;
    return (
      <AccountSettingsStack screenProps={{ topLevelNavigation: navigation }} />
    );
  }
}

const AddAccountStack = StackNavigator(
  {
    AddAccountSelectCurrency: { screen: AddAccountSelectCurrency },
    AddAccountInfo: { screen: AddAccountInfo }
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card
  }
);

class AddAccount extends Component<*> {
  static navigationOptions = {
    header: null
  };
  render() {
    const { navigation } = this.props;
    return <AddAccountStack screenProps={{ parentNavigation: navigation }} />;
  }
}

const MainNavigator = TabNavigator(
  {
    Dashboard: { screen: Dashboard },
    Accounts: { screen: Accounts },
    Create: { screen: Create },
    Search: { screen: Search },
    Settings: { screen: SettingsStack }
  },
  {
    tabBarComponent: TabBarBottom,
    tabBarPosition: "bottom",
    swipeEnabled: false,
    animationEnabled: false,
    tabBarOptions: {
      showLabel: false,
      activeTintColor: "white",
      inactiveTintColor: "rgb(164,165,168)",
      style: {
        backgroundColor: colors.darkBar
      },
      indicatorStyle: {
        backgroundColor: "#ffffff",
        height: 4
      }
    }
  }
);

class Main extends Component<*> {
  static navigationOptions = {
    header: null
  };
  render() {
    const { navigation } = this.props;
    return <MainNavigator screenProps={{ topLevelNavigation: navigation }} />;
  }
}

const ReceiveFundsStack = StackNavigator(
  {
    ReceiveFundsMain: { screen: ReceiveFundsMain },
    ReceiveFundsSelectAccount: { screen: ReceiveFundsSelectAccount }
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card
  }
);
class ReceiveFunds extends Component<*> {
  static navigationOptions = {
    header: null
  };
  render() {
    const { navigation } = this.props;
    return (
      <ReceiveFundsStack screenProps={{ topLevelNavigation: navigation }} />
    );
  }
}

const SendFundsStack = StackNavigator(
  {
    SendFundsSelectAccount: { screen: SendFundsSelectAccount },
    SendFundsScanAddress: { screen: SendFundsScanAddress },
    SendFundsChoseAmount: { screen: SendFundsChoseAmount },
    SendFundsChoseFee: { screen: SendFundsChoseFee },
    SendFundsReview: { screen: SendFundsReview },
    SendFundsPlugDevice: { screen: SendFundsPlugDevice },
    SendFundsConfirmation: { screen: SendFundsConfirmation }
  },
  {
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card
  }
);
class SendFunds extends Component<*> {
  static navigationOptions = {
    header: null
  };
  render() {
    const { navigation } = this.props;
    return <SendFundsStack screenProps={{ topLevelNavigation: navigation }} />;
  }
}

export const RootNavigator = StackNavigator(
  {
    Main: { screen: Main },
    ReceiveFunds: {
      path: "receive",
      screen: ReceiveFunds
    },
    SendFunds: {
      path: "send",
      screen: SendFunds
    },
    OperationDetails: { screen: OperationDetails },
    AddAccount: { screen: AddAccount },
    AccountSettings: { screen: AccountSettingsConfig },
    ImportAccounts: { screen: ImportAccounts },
    ReceiveFundsSelectAccount: { screen: ReceiveFundsSelectAccount }
  },
  {
    mode: "modal",
    navigationOptions: stackNavigatiorDefaultNavigationOptions,
    cardStyle: styles.card
  }
);
