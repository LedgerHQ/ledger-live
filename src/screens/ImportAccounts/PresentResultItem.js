// @flow
import React, { Component } from "react";
import { Switch, View, ActivityIndicator } from "react-native";
import type { Account } from "@ledgerhq/live-common/lib/types";

import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import LText from "../../components/LText";

export default class PresentResultItem extends Component<{
  account: Account,
  mode: *,
  checked: boolean,
  loading: boolean,
  importing: boolean,
  onSwitch: (boolean, Account) => void,
}> {
  onSwitch = (checked: boolean) => {
    this.props.onSwitch(checked, this.props.account);
  };

  render() {
    const { account, checked, mode, loading, importing } = this.props;
    return (
      <View
        style={{
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {mode === "id" ? null : (
          <Switch
            onValueChange={this.onSwitch}
            value={checked}
            disabled={importing}
          />
        )}
        <LText semiBold style={{ paddingHorizontal: 10 }} numberOfLines={1}>
          {account.name}
        </LText>
        <View style={{ flex: 1 }} />
        <LText>
          <CurrencyUnitValue
            unit={account.unit}
            value={account.balance}
            showCode
            ltextProps={{
              numberOfLines: 1,
              style: {
                marginRight: 5,
              },
            }}
          />
        </LText>
        {mode === "create" && loading ? <ActivityIndicator /> : null}
      </View>
    );
  }
}
