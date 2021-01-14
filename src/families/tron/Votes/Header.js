// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import Button from "../../../components/Button";
import AccountSectionLabel from "../../../components/AccountSectionLabel";

type Props = {
  count: number,
  onPress: () => void,
};

export default function Header({ count, onPress }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <View style={styles.root}>
        <AccountSectionLabel name={t("tron.voting.header", { total: count })} />
        <Button
          containerStyle={styles.button}
          type="lightSecondary"
          event="TronManageVotes"
          onPress={onPress}
          title={t("tron.voting.manageVotes")}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
    textAlign: "left",
    paddingVertical: 4,
  },
  button: { paddingRight: 0 },
});
