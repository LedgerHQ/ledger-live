// @flow
import React, { Component } from "react";
import { Switch, View } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import AccountCard from "../../components/AccountCard";

const selectableModes = ["create", "patch"];

export default class DisplayResultItem extends Component<{
  account: Account,
  mode: *,
  checked: boolean,
  importing: boolean,
  onSwitch: (boolean, Account) => void,
}> {
  onSwitch = (checked: boolean) => {
    this.props.onSwitch(checked, this.props.account);
  };

  render() {
    const { account, checked, mode, importing } = this.props;
    const selectable = selectableModes.includes(mode);
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          opacity: selectable ? 1 : 0.5,
        }}
      >
        <AccountCard account={account} />
        {!selectable ? null : (
          <Switch
            onValueChange={this.onSwitch}
            value={checked}
            disabled={importing}
            style={{ marginLeft: 16 }}
          />
        )}
      </View>
    );
  }
}
