// @flow
import React, { PureComponent } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import type { Unit } from "@ledgerhq/currencies";

import LText from "../components/LText";

export default class UnitRow extends PureComponent<{
  unit: Unit,
  onPress: () => void
}> {
  render() {
    const { unit, onPress } = this.props;
    return (
      <TouchableOpacity onPress={onPress}>
        <View style={styles.unitRow}>
          <LText
            semiBold
            numberOfLines={1}
            style={{
              fontSize: 14
            }}
          >
            {unit.name}
          </LText>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  unitRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "white",
    marginBottom: 1
  }
});
