/* @flow */
import React, { Component } from "react";
import { FlatList } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../components/SettingsRow";

type EntryComponent<Item> = React$ComponentType<{
  item: Item,
  onPress: Item => void
}>;

type Opts<Item> = {
  title: string,
  keyExtractor: Item => string,
  formatItem?: Item => string,
  Entry?: EntryComponent<Item>
};

function getEntryFromOptions<Item>(opts: Opts<Item>): EntryComponent<Item> {
  if (opts.Entry) return opts.Entry;
  const { formatItem } = opts;
  if (!formatItem) {
    throw new Error("formatItem is required if Entry is not provided");
  }
  return class DefaultEntry extends Component<{
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

export default <Item>(opts: Opts<Item>) => {
  const { title, keyExtractor } = opts;
  const Entry = getEntryFromOptions(opts);

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
