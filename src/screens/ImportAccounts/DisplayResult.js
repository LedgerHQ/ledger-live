// @flow
import React, { Component } from "react";
import { ScrollView, View, SectionList, StyleSheet } from "react-native";
import groupBy from "lodash/groupBy";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Result } from "@ledgerhq/live-common/lib/bridgestream/types";
import { translate } from "react-i18next";
import i18next from "i18next";
import type { T } from "../../types/common";
import {
  importExistingAccount,
  supportsExistingAccount,
} from "../../logic/account";
import { addAccount, updateAccount } from "../../actions/accounts";
import { accountsSelector } from "../../reducers/accounts";

import LText from "../../components/LText";
import colors from "../../colors";
import BlueButton from "../../components/BlueButton";
import HeaderRightClose from "../../components/HeaderRightClose";
import StyledStatusBar from "../../components/StyledStatusBar";
import DisplayResultItem from "./DisplayResultItem";

type Item = {
  // current account, might be partially completed as sync happen in background
  account: Account,
  // create: account is a new entity to create
  // patch: account exists and need to be patched
  // id: account exists and nothing changes
  // unsupported: we can't support adding this account
  mode: "create" | "patch" | "id" | "unsupported",
};

type Props = {
  navigation: NavigationScreenProp<{ result: Result }>,
  onDone: () => void,
  accounts: Account[],
  addAccount: Account => void,
  updateAccount: ($Shape<Account>) => void,
  t: T,
};

type State = {
  selectedAccounts: string[],
  items: Item[],
  importing: boolean,
};

const itemModeDisplaySort = {
  create: 1,
  patch: 2,
  id: 3,
  unsupported: 4,
};

class DisplayResult extends Component<Props, State> {
  state = {
    selectedAccounts: [],
    items: [],
    importing: false,
  };

  unmounted = false;

  componentWillUnmount() {
    this.unmounted = true;
  }

  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<*>,
  }) => ({
    title: i18next.t("account.import.result.title"),
    headerRight: (
      <HeaderRightClose
        // $FlowFixMe
        navigation={navigation.dangerouslyGetParent()}
      />
    ),
    headerLeft: null,
  });

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const items = nextProps.navigation
      .getParam("result")
      .accounts.map(accInput => {
        const prevItem = prevState.items.find(
          item => item.account.id === accInput.id,
        );
        if (prevItem) return prevItem;
        const existingAccount = nextProps.accounts.find(
          a => a.id === accInput.id,
        );
        if (existingAccount) {
          // only the name is supposed to change. rest is never changing
          if (existingAccount.name === accInput.name) {
            return {
              account: existingAccount,
              mode: "id",
            };
          }
          return {
            account: { ...existingAccount, name: accInput.name },
            mode: "patch",
          };
        }
        try {
          const account = importExistingAccount(accInput);
          return {
            account,
            mode: supportsExistingAccount(accInput) ? "create" : "unsupported",
          };
        } catch (e) {
          console.log(e);
          return null;
        }
      })
      .filter(o => o)
      .sort(
        (a, b) => itemModeDisplaySort[a.mode] - itemModeDisplaySort[b.mode],
      );

    let selectedAccounts = prevState.selectedAccounts;
    if (prevState.items.length === 0) {
      // select all by default
      selectedAccounts = items.map(i => i.account.id);
    }
    return { items, selectedAccounts };
  }

  onImport = async () => {
    const { navigation, addAccount, updateAccount } = this.props;
    const { selectedAccounts, items } = this.state;
    this.setState({ importing: true });
    const selectedItems = items.filter(item =>
      selectedAccounts.includes(item.account.id),
    );
    for (const { mode, account } of selectedItems) {
      switch (mode) {
        case "create":
          addAccount(account);
          break;
        case "patch":
          updateAccount({ id: account.id, name: account.name });
          break;
        default:
      }
    }

    // TODO we probably want to sync all the imported accounts before ending
    // $FlowFixMe
    navigation.dangerouslyGetParent().goBack();
  };

  onSwitchResultItem = (checked: boolean, account: Account) => {
    if (checked) {
      this.setState(({ selectedAccounts }) => ({
        selectedAccounts: selectedAccounts.concat(account.id),
      }));
    } else {
      this.setState(({ selectedAccounts }) => ({
        selectedAccounts: selectedAccounts.filter(s => s !== account.id),
      }));
    }
  };

  renderItem = ({ item: { account, mode } }) => (
    <DisplayResultItem
      key={account.id}
      account={account}
      mode={mode}
      checked={this.state.selectedAccounts.some(s => s === account.id)}
      onSwitch={this.onSwitchResultItem}
      importing={this.state.importing}
    />
  );

  renderSectionHeader = ({ section: { mode } }) => {
    const { t } = this.props;
    let text;
    switch (mode) {
      case "create":
        text = t("account.import.result.newAccounts");
        break;
      case "patch":
        text = t("account.import.result.updatedAccounts");
        break;
      case "id":
        text = t("account.import.result.alreadyImported");
        break;
      case "unsupported":
        text = t("account.import.result.unsupported");
        break;
      default:
        text = "";
    }
    return (
      <LText semiBold style={styles.sectionHeaderText}>
        {text}
      </LText>
    );
  };

  ListFooterComponent = () =>
    this.state.selectedAccounts.length === 0 ? null : (
      <BlueButton
        title={this.props.t("common.continue")}
        onPress={this.onImport}
        containerStyle={styles.button}
        titleStyle={styles.buttonText}
      />
    );

  SectionSeparatorComponent = () => <View style={{ height: 20 }} />;

  keyExtractor = item => item.account.id;

  render() {
    const { onDone, t } = this.props;
    const { items } = this.state;

    const itemsGroupedByMode = groupBy(items, "mode");

    return (
      <ScrollView contentContainerStyle={styles.DisplayResult}>
        <StyledStatusBar />
        {items.length === 0 ? (
          <View>
            <LText bold>{t("account.import.result.noAccounts")}</LText>
            <BlueButton title="Done" onPress={onDone} />
          </View>
        ) : (
          <SectionList
            renderItem={this.renderItem}
            renderSectionHeader={this.renderSectionHeader}
            keyExtractor={this.keyExtractor}
            SectionSeparatorComponent={this.SectionSeparatorComponent}
            ListFooterComponent={this.ListFooterComponent}
            sections={Object.keys(itemsGroupedByMode).map(mode => ({
              mode,
              data: itemsGroupedByMode[mode],
            }))}
          />
        )}
      </ScrollView>
    );
  }
}

export default translate()(
  connect(
    createStructuredSelector({ accounts: accountsSelector }),
    {
      addAccount,
      updateAccount,
    },
  )(DisplayResult),
);

const styles = StyleSheet.create({
  DisplayResult: {
    padding: 20,
    backgroundColor: "white",
  },
  sectionHeaderText: {
    color: colors.grey,
    fontSize: 14,
  },
  button: {
    height: 48,
  },
  buttonText: {
    fontSize: 16,
  },
});
