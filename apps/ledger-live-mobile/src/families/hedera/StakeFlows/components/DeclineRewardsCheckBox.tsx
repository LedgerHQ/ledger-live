import React from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";

import CheckBox from "../../../../components/CheckBox";

type Props = {
  isChecked: boolean;
  onChange: (_: boolean) => void;
};

function DeclineRewardsCheckBox({ isChecked, onChange }: Props) {
  return (
    <View style={styles.checkboxWrapper}>
      <View style={styles.checkbox}>
        <CheckBox isChecked={isChecked} onChange={onChange} />
      </View>
      <Text>
        <Trans i18nKey="hedera.stake.flow.stake.declineRewards" />
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 6,
  },
});

export default DeclineRewardsCheckBox;
