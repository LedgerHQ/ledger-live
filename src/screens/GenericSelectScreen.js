/* @flow */
import React, { Component } from "react";
import { View, FlatList } from "react-native";
// import type { NavigationScreenProp } from "react-navigation";
import SectionEntry from "../components/SectionEntry";
import LText from "../components/LText";

type Item = {
  label: string,
  value: *
};

// TODO: wrap my head around how flowtyping work with react-navigation screens
// type NavigationState = {
//   params: {
//     title: string,
//     data: *,
//     callback: Item => void
//   }
// };

// type Navigation = NavigationScreenProp<NavigationState, *>;

class GenericSelectScreen extends Component<{
  navigation: *
}> {
  static navigationOptions = ({ navigation }: { navigation: * }) => {
    const { title } = navigation.state.params;
    return { title };
  };

  static keyExtractor = (item: Item) => `${item.value}`;

  onPress = (item: Item) => {
    const { navigation } = this.props;
    const { callback } = navigation.state.params;

    callback(item);
    navigation.goBack();
  };

  renderItem = ({ item }: { item: Item }) => (
    <SectionEntry onPress={() => this.onPress(item)}>
      <LText>{item.label}</LText>
    </SectionEntry>
  );

  render() {
    const { data } = this.props.navigation.state.params;

    return (
      <View>
        <FlatList
          data={data}
          renderItem={this.renderItem}
          keyExtractor={this.constructor.keyExtractor}
        />
      </View>
    );
  }
}

export default GenericSelectScreen;
