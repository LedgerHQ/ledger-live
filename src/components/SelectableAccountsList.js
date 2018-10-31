// @flow

import React, { PureComponent, Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";

import AccountCard from "./AccountCard";
import CheckBox from "./CheckBox";
import LText from "./LText";
import colors from "../colors";

const selectAllHitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

type ListProps = {
  accounts: Account[],
  onPressAccount?: Account => void,
  onSelectAll?: (Account[]) => void,
  onUnselectAll?: (Account[]) => void,
  selectedIds: string[],
  isDisabled?: boolean,
  forceSelected?: boolean,
  EmptyState?: React$ComponentType<*>,
  header: string,
  style?: *,
};

class SelectableAccountsList extends Component<ListProps> {
  static defaultProps = {
    selectedIds: [],
    isDisabled: false,
  };

  onSelectAll = () => {
    const { onSelectAll, accounts } = this.props;
    onSelectAll && onSelectAll(accounts);
  };

  onUnselectAll = () => {
    const { onUnselectAll, accounts } = this.props;
    onUnselectAll && onUnselectAll(accounts);
  };

  render() {
    const {
      accounts,
      onPressAccount,
      onSelectAll,
      onUnselectAll,
      selectedIds,
      isDisabled,
      forceSelected,
      EmptyState,
      header,
      style,
    } = this.props;
    const areAllSelected = accounts.every(a => selectedIds.indexOf(a.id) > -1);
    return (
      <View style={[styles.root, style]}>
        {header && (
          <Header
            text={header}
            areAllSelected={areAllSelected}
            onSelectAll={onSelectAll ? this.onSelectAll : undefined}
            onUnselectAll={onUnselectAll ? this.onUnselectAll : undefined}
          />
        )}
        {accounts.map(account => (
          <SelectableAccount
            key={account.id}
            account={account}
            isSelected={forceSelected || selectedIds.indexOf(account.id) > -1}
            isDisabled={isDisabled}
            onPress={onPressAccount}
          />
        ))}
        {accounts.length === 0 && EmptyState && <EmptyState />}
      </View>
    );
  }
}

class SelectableAccount extends PureComponent<{
  account: Account,
  onPress?: Account => void,
  isDisabled?: boolean,
  isSelected?: boolean,
}> {
  onPress = () => {
    const { onPress, account } = this.props;
    if (onPress) onPress(account);
  };

  render() {
    const { isDisabled, isSelected, account } = this.props;
    const inner = (
      <View
        style={[
          styles.selectableAccountRoot,
          isDisabled && styles.selectableAccountRootDisabled,
        ]}
      >
        <AccountCard account={account} />
        {!isDisabled && (
          <CheckBox
            isChecked={!!isSelected}
            style={styles.selectableAccountCheckbox}
          />
        )}
      </View>
    );
    if (isDisabled) return inner;
    return (
      <TouchableOpacity onPress={isDisabled ? undefined : this.onPress}>
        {inner}
      </TouchableOpacity>
    );
  }
}

class Header extends PureComponent<{
  text: string,
  areAllSelected: boolean,
  onSelectAll?: () => void,
  onUnselectAll?: () => void,
}> {
  render() {
    const { text, areAllSelected, onSelectAll, onUnselectAll } = this.props;
    const shouldDisplaySelectAll = !!onSelectAll && !!onUnselectAll;
    return (
      <View style={styles.listHeader}>
        <LText semiBold style={styles.headerText}>
          {text}
        </LText>
        {shouldDisplaySelectAll && (
          <TouchableOpacity
            style={styles.headerSelectAll}
            onPress={areAllSelected ? onUnselectAll : onSelectAll}
            hitSlop={selectAllHitSlop}
          >
            <LText style={styles.headerSelectAllText}>
              {areAllSelected ? "Deselect all" : "Select all"}
            </LText>
          </TouchableOpacity>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  selectableAccountRoot: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectableAccountRootDisabled: {
    opacity: 0.4,
  },
  selectableAccountCheckbox: {
    marginLeft: 16,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
  },
  headerSelectAll: {
    flexShrink: 1,
  },
  headerSelectAllText: {
    fontSize: 14,
    color: colors.live,
  },
  headerText: {
    flexGrow: 1,
    fontSize: 14,
    color: colors.grey,
  },
});

export default SelectableAccountsList;
