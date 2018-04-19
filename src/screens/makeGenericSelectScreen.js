/* @flow */
import React, { Component } from "react";
import { FlatList } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../components/SettingsRow";

type Opts<Item> = {
  title: string,
  keyExtractor: Item => string,
  formatItem?: Item => string,
  Entry?: React$ComponentType<{
    item: Item,
    onPress: Item => void
  }>
};

export default <Item>(opts: Opts<Item>) => {
  const { title, keyExtractor, formatItem } = opts;
  let { Entry } = opts;
  if (!Entry) {
    if (!formatItem) {
      throw new Error("formatItem is required if Entry is not provided");
    }
    Entry = class DefaultEntry extends Component<{
      item: Item,
      onPress: Item => void
    }> {
      onPress = () => this.props.onPress(this.props.item);
      render() {
        const { item } = this.props;
        return <SettingsRow title={formatItem(item)} onPress={this.onPress} />;
      }
    };
  }

  return class GenericSelectScreen extends Component<{
    value: Item,
    items: Item[],
    onValueChange: Item => void,
    navigation: NavigationScreenProp<*>
  }> {
    static navigationOptions = { title };

    onPress = (item: Item) => {
      const { navigation, onValueChange } = this.props;
      onValueChange(item);
      navigation.goBack();
    };

    renderItem = ({ item }: { item: Item }) => (
      <Entry onPress={this.onPress} item={item} />
    );

    render() {
      return (
        <FlatList
          data={this.props.items}
          renderItem={this.renderItem}
          keyExtractor={keyExtractor}
        />
      );
    }
  };
};
