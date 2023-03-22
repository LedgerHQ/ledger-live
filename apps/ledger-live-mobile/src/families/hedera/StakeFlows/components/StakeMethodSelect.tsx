import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";

import ToggleButton from "../../../../components/ToggleButton";

import type { StakeMethod } from "@ledgerhq/live-common/families/hedera/types";

type Props = {
  value: string;
  disabled?: boolean;
  options: Array<{
    value: string;
    label: string | React.ReactNode;
    disabled?: boolean;
  }>;
  onChange: (_: StakeMethod | string) => void;
};

const StakeMethodSelect = ({ value, options, onChange }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Stake to</Text>
      <ToggleButton value={value} options={options} onChange={onChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 48,
  },
  text: {
    marginBottom: 6,
  },
});

export default StakeMethodSelect;