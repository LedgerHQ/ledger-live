// @flow
import React, { Component } from "react";
import { ScrollView, View, SectionList, StyleSheet } from "react-native";
import groupBy from "lodash/groupBy";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Result } from "@ledgerhq/live-common/lib/bridgestream/types";
import { importExistingAccount } from "../../logic/account";
import { addAccount, updateAccount } from "../../actions/accounts";
import { accountsSelector } from "../../reducers/accounts";

import LText from "../../components/LText";
import BlueButton from "../../components/BlueButton";
import PresentResultItem from "./PresentResultItem";

type Item = {
  // current account, might be partially completed as sync happen in background
  account: Account,
  // create: account is a new entity to create
  // patch: account exists and need to be patched
  // id: account exists and nothing changes
  mode: "create" | "patch" | "id",
};

type Props = {
  result: Result,
  onDone: () => void,
  accounts: Account[],
  addAccount: Account => void,
  updateAccount: ($Shape<Account>) => void,
};
type State = {
  selectedAccounts: string[],
  items: Item[],
  importing: boolean,
  pendingImportingAccounts: { [_: string]: true },
};

const itemModeDisplaySort = {
  create: 1,
  patch: 2,
  id: 3,
};

class PresentResult extends Component<Props, State> {
  state = {
    selectedAccounts: [],
    items: [],
    importing: false,
    pendingImportingAccounts: {},
  };

  unmounted = false;

  componentWillUnmount() {
    this.unmounted = true;
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const pendingImportingAccounts = { ...prevState.pendingImportingAccounts };
    const items = nextProps.result.accounts
      .map(accInput => {
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

        const account = importExistingAccount(accInput);

        pendingImportingAccounts[accInput.id] = true;
        return { account, mode: "create" };
      })
      .sort(
        (a, b) => itemModeDisplaySort[a.mode] - itemModeDisplaySort[b.mode],
      );
    return { items, pendingImportingAccounts };
  }

  onImport = async () => {
    const { onDone, addAccount, updateAccount } = this.props;
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

    onDone();
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
    <PresentResultItem
      key={account.id}
      account={account}
      mode={mode}
      checked={this.state.selectedAccounts.some(s => s === account.id)}
      onSwitch={this.onSwitchResultItem}
      loading={account.id in this.state.pendingImportingAccounts}
      importing={this.state.importing}
    />
  );

  renderSectionHeader = ({ section: { mode, data } }) => {
    let text;
    switch (mode) {
      case "create":
        text = `${data.length} new accounts`;
        break;
      case "patch":
        text = `${data.length} accounts with new changes`;
        break;
      case "id":
        text = `${data.length} accounts already imported`;
        break;
      default:
        text = "";
    }
    return <LText bold>{text}</LText>;
  };

  ListFooterComponent = () =>
    this.state.selectedAccounts.length === 0 ? null : (
      <BlueButton title="Import" onPress={this.onImport} />
    );

  SectionSeparatorComponent = () => <View style={{ height: 20 }} />;

  keyExtractor = item => item.account.id;

  render() {
    const { onDone } = this.props;
    const { items } = this.state;

    const itemsGroupedByMode = groupBy(items, "mode");

    return (
      <ScrollView contentContainerStyle={styles.presentResult}>
        {items.length === 0 ? (
          <View>
            <LText bold>Nothing to import.</LText>
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
export default connect(
  createStructuredSelector({ accounts: accountsSelector }),
  {
    addAccount,
    updateAccount,
  },
)(PresentResult);

const styles = StyleSheet.create({
  presentResult: {
    padding: 20,
  },
});
