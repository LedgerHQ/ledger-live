/* @flow */
import React, { Component } from "react";
import { StyleSheet, Image } from "react-native";
import LText from "../../components/LText";
import SectionEntry from "../../components/SectionEntry";

class ChartTimeRangeSection extends Component<*> {
  render() {
    const { navigation, saveSettings, value } = this.props;
    const arrowRight = require("../../images/arrow_right.png");

    const rangeList = [
      { value: 7, label: "1 week" },
      { value: 14, label: "2 weeks" },
      { value: 30, label: "1 month" },
      { value: 60, label: "2 months" },
      { value: 90, label: "3 months" },
      { value: 120, label: "4 months" },
      { value: 180, label: "6 months" },
      { value: 365, label: "1 year" }
    ];

    const getLabelFromValue = value => {
      const obj = rangeList.find(o => o.value === value);

      return obj ? obj.label : `${value} days`;
    };

    const callback = item => {
      saveSettings({ chartTimeRange: item.value });
    };

    return (
      <SectionEntry
        onPress={() =>
          navigation.navigate({
            routeName: "ChartTimeRange",
            key: "ChartTimeRange",
            params: {
              title: "Dashboard chart time range",
              data: rangeList,
              callback
            }
          })
        }
      >
        <LText>Dashboard chart time range</LText>
        <LText style={styles.tempLineHeight}>
          {getLabelFromValue(value)}
          <Image source={arrowRight} />
        </LText>
      </SectionEntry>
    );
  }
}

export default ChartTimeRangeSection;

const styles = StyleSheet.create({
  tempLineHeight: {
    lineHeight: 30
  }
});
