import { ImportItem } from "@ledgerhq/live-common/account/importAccounts";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { track } from "~/analytics";
import AccountCard from "~/components/AccountCard";
import CheckBox from "~/components/CheckBox";

const selectableModes = ["create", "update"];

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

type Props = {
  account: Account;
  mode: ImportItem["mode"];
  checked: boolean;
  importing: boolean;
  onSwitch: (checked: boolean, account: Account) => void;
};

const DisplayResultItem = ({ account, mode, checked, importing, onSwitch }: Props) => {
  const handleSwitch = () => {
    track(checked ? "AccountSwitchOff" : "AccountSwitchOn");
    onSwitch(!checked, account);
  };

  const selectable = selectableModes.includes(mode);

  return (
    <TouchableOpacity
      onPress={importing ? undefined : handleSwitch}
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
            <CheckBox onChange={handleSwitch} isChecked={checked} />
          )}
        </Flex>
      )}
    </TouchableOpacity>
  );
};

export default DisplayResultItem;
