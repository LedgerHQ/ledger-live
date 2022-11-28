import React, { Component } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Account } from "@ledgerhq/types-live";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { ImportItem } from "@ledgerhq/live-common/account/importAccounts";
import AccountCard from "../../components/AccountCard";
import CheckBox from "../../components/CheckBox";
import { track } from "../../analytics";

const selectableModes = ["create", "update"];

export default class DisplayResultItem extends Component<{
  account: Account;
  mode: ImportItem["mode"];
  checked: boolean;
  importing: boolean;
  onSwitch: (checked: boolean, account: Account) => void;
}> {
  onSwitch = () => {
    track(this.props.checked ? "AccountSwitchOff" : "AccountSwitchOn");
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
        <Flex flex={1}>
          <AccountCard account={account} style={styles.card} />
        </Flex>
        {!selectable ? null : (
          <Flex ml={8}>
            {importing ? (
              <InfiniteLoader />
            ) : (
              <CheckBox onChange={this.onSwitch} isChecked={checked} />
            )}
          </Flex>
        )}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  card: {
    marginLeft: 8,
  },
});
