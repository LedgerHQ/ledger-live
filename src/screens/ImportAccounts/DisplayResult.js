// @flow
import React, { Component } from "react";
import { ScrollView, View, SectionList, StyleSheet } from "react-native";
import groupBy from "lodash/groupBy";
import concat from "lodash/concat";
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
          console.warn(e);
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
      selectedAccounts = items.reduce(
        (acc, cur) =>
          cur.mode === "create" || cur.mode === "patch"
            ? concat(acc, cur.account.id)
            : acc,
        [],
      );
    }
    return { items, selectedAccounts };
  }

  close = () => {
    const { navigation } = this.props;

    // $FlowFixMe
    navigation.dangerouslyGetParent().goBack();
  };

  onImport = async () => {
    const { addAccount, updateAccount } = this.props;
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
    this.close();
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

  SectionSeparatorComponent = () => <View style={{ height: 20 }} />;

  keyExtractor = item => item.account.id;

  render() {
    const { t } = this.props;
    const { items, selectedAccounts } = this.state;

    const itemsGroupedByMode = groupBy(items, "mode");

    return (
      <View style={styles.root}>
        <StyledStatusBar />
        {items.length ? (
          <ScrollView contentContainerStyle={styles.DisplayResult}>
            <SectionList
              renderItem={this.renderItem}
              renderSectionHeader={this.renderSectionHeader}
              keyExtractor={this.keyExtractor}
              SectionSeparatorComponent={this.SectionSeparatorComponent}
              sections={Object.keys(itemsGroupedByMode).map(mode => ({
                mode,
                data: itemsGroupedByMode[mode],
              }))}
            />
            {selectedAccounts.length ? (
              <BlueButton
                title={t("common.continue")}
                onPress={this.onImport}
                containerStyle={styles.button}
                titleStyle={styles.buttonText}
              />
            ) : null}
          </ScrollView>
        ) : (
          <View style={styles.DisplayResult}>
            <LText bold style={styles.noAccountText}>
              {t("account.import.result.noAccounts")}
            </LText>
            <BlueButton
              title={t("common.done")}
              onPress={this.close}
              containerStyle={styles.button}
              titleStyle={styles.buttonText}
            />
          </View>
        )}
      </View>
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
  root: {
    flex: 1,
    flexGrow: 1,
    flexDirection: "column",
    alignSelf: "stretch",
    justifyContent: "space-between",
    backgroundColor: colors.white,
  },
  DisplayResult: {
    padding: 20,
    flexDirection: "column",
    flexGrow: 1,
  },
  sectionHeaderText: {
    color: colors.grey,
    fontSize: 14,
  },
  button: {
    paddingVertical: 16,
    height: "auto",
  },
  buttonText: {
    fontSize: 16,
  },
  noAccountText: {
    flex: 1,
    fontSize: 16,
  },
});
