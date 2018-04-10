/* @flow */
import React, { Component } from "react";
import { View, FlatList } from "react-native";
import { connect } from "react-redux";
import { listFiats } from "@ledgerhq/currencies";
import UnitRow from "../../components/UnitRow";
import { saveSettings } from "../../actions/settings";
import type { SaveSettings } from "../../actions/settings";

const mapDispatchToProps = {
  saveSettings
};

class SelectFiatUnit extends Component<{
  navigation: *,
  saveSettings: SaveSettings
}> {
  static navigationOptions = {
    title: "Countervalue currency"
  };

  onPress = (item: *) => {
    const { navigation, saveSettings } = this.props;

    saveSettings({ counterValue: item.code });
    navigation.goBack();
  };

  renderItem = ({ item }) => (
    <UnitRow unit={item} onPress={() => this.onPress(item)} />
  );

  keyExtractor = item => item.code;

  render() {
    const fiatList = listFiats();

    fiatList.sort((a, b) => a.name.localeCompare(b.name));

    return (
      <View>
        <FlatList
          data={fiatList}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
        />
      </View>
    );
  }
}

export default connect(null, mapDispatchToProps)(SelectFiatUnit);
