/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, Image } from "react-native";
import { listFiats } from "@ledgerhq/currencies";
import LText from "../../components/LText";
import SectionEntry from "../../components/SectionEntry";

const fiatList = listFiats()
  .reduce(
    (acc, cur) => [
      ...acc,
      { value: cur.code, label: `${cur.name} (${cur.code})` }
    ],
    []
  )
  .sort((a, b) => a.label.localeCompare(b.label));

class FiatUnitSection extends PureComponent<*> {
  render() {
    const { navigation, saveSettings, value } = this.props;
    const arrowRight = require("../../images/arrow_right.png");

    const callback = item => {
      saveSettings({ counterValue: item.value });
    };

    return (
      <SectionEntry
        onPress={() =>
          navigation.navigate({
            routeName: "SelectFiatUnit",
            key: "selectfiatunit",
            params: {
              title: "Countervalue currency",
              data: fiatList,
              callback
            }
          })
        }
      >
        <LText>Countervalue currency</LText>
        <LText style={styles.tempLineHeight}>
          {value}
          <Image source={arrowRight} />
        </LText>
      </SectionEntry>
    );
  }
}

export default FiatUnitSection;

const styles = StyleSheet.create({
  tempLineHeight: {
    lineHeight: 30
  }
});
