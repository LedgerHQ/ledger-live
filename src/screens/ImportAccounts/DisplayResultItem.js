// @flow
import React, { Component } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import AccountCard from "../../components/AccountCard";
import CheckBox from "../../components/CheckBox";

const selectableModes = ["create", "patch"];

export default class DisplayResultItem extends Component<{
  account: Account,
  mode: *,
  checked: boolean,
  importing: boolean,
  onSwitch: (boolean, Account) => void,
}> {
  onSwitch = () => {
    this.props.onSwitch(!this.props.checked, this.props.account);
  };

  render() {
    const { account, checked, mode, importing } = this.props;
    const selectable = selectableModes.includes(mode);
    return (
      <TouchableOpacity
        onPress={importing ? undefined : this.onSwitch}
        style={[styles.root, { opacity: selectable ? 1 : 0.5 }]}
      >
        <AccountCard account={account} />
        {!selectable ? null : (
          <CheckBox isChecked={checked} style={styles.marginLeft} />
        )}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  marginLeft: { marginLeft: 16 },
});
