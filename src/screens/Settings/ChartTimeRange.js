/* @flow */
import React, { Component } from "react";
import { View, FlatList } from "react-native";
import { connect } from "react-redux";
import SectionEntry from "../../components/SectionEntry";
import LText from "../../components/LText";
import { saveSettings } from "../../actions/settings";
import type { SaveSettings } from "../../actions/settings";

const mapDispatchToProps = {
  saveSettings
};

const rangeList = {
  "7": "1 week",
  "14": "2 weeks",
  "30": "1 month",
  "60": "2 months",
  "90": "3 months",
  "120": "4 months",
  "180": "6 months",
  "365": "1 year"
};

export const getLabelFromRange = (range: number | string) => {
  const key = typeof range === "string" ? range : range.toString();

  return rangeList[key] ? rangeList[key] : `${key} days`;
};

class ChartTimeRange extends Component<{
  navigation: *,
  saveSettings: SaveSettings
}> {
  static navigationOptions = {
    title: "Dashboard chart time range"
  };

  onPress = item => {
    const { navigation, saveSettings } = this.props;

    saveSettings({ chartTimeRange: parseInt(item, 10) });
    navigation.goBack();
  };

  renderItem = ({ item }) => (
    <SectionEntry onPress={() => this.onPress(item)}>
      <LText>{getLabelFromRange(item)}</LText>
    </SectionEntry>
  );

  render() {
    const list = Object.keys(rangeList);

    return (
      <View>
        <FlatList
          data={list}
          renderItem={this.renderItem}
          keyExtractor={item => item}
        />
      </View>
    );
  }
}

export default connect(null, mapDispatchToProps)(ChartTimeRange);
