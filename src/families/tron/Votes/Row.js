// @flow

import React, { useCallback } from "react";
import { View, Linking, StyleSheet, TouchableOpacity } from "react-native";

import LText from "../../../components/LText";
import colors from "../../../colors";
import Clock from "../../../icons/Clock";

type Props = {
  validator: *,
  address: string,
  amount: number,
  duration: React$Node,
  percentTP: string,
};

const Row = ({ validator, address, amount, duration, percentTP }: Props) => {
  const srURL = validator && validator.url;

  const openSR = useCallback(() => {
    if (srURL) Linking.openURL(srURL);
  }, [srURL]);

  return (
    <View style={styles.root}>
      <View style={styles.labelContainer}>
        <TouchableOpacity onPress={openSR}>
          <LText semiBold style={styles.title}>
            {validator ? validator.name : address}
          </LText>
        </TouchableOpacity>
        <View style={styles.durationContainer}>
          <Clock size={12} color={colors.grey} />
          <LText style={styles.label}>{duration}</LText>
        </View>
      </View>
      <View style={[styles.labelContainer, styles.labelContainerRight]}>
        <LText semiBold style={styles.title}>
          TP {amount}
        </LText>
        <LText style={styles.label}>{percentTP}%</LText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    lineHeight: 16,
    color: colors.darkBlue,
    paddingBottom: 4,
  },
  labelContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    flex: 1,
  },
  labelContainerRight: {
    alignItems: "flex-end",
  },
  label: {
    fontSize: 13,
    color: colors.grey,
    marginLeft: 6,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default Row;
