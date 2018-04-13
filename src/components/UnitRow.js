// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import type { Unit } from "@ledgerhq/currencies";

import Touchable from "./Touchable";
import LText from "./LText";

export default class UnitRow extends PureComponent<{
  unit: Unit,
  onPress: () => void
}> {
  render() {
    const { unit, onPress } = this.props;
    return (
      <Touchable onPress={onPress}>
        <View style={styles.unitRow}>
          <LText
            semiBold
            numberOfLines={1}
            style={{
              fontSize: 14
            }}
          >
            {unit.name} ({unit.code})
          </LText>
        </View>
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  unitRow: {
    minHeight: 50,
    flexDirection: "row",
    padding: 20,
    backgroundColor: "white",
    marginBottom: 1
  }
});
