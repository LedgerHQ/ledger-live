// @flow
import React, { Component } from "react";
import { Switch, View } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import AccountCard from "../../components/AccountCard";

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
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <AccountCard account={account} />
        {mode === "id" ? null : (
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
