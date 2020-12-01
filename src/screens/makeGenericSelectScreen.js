/* @flow */
import React, { Component } from "react";
import { FlatList, StyleSheet } from "react-native";
import { track } from "../analytics";
import SettingsRow from "../components/SettingsRow";

type EntryProps<Item> = {
  item: Item,
  onPress: Item => void,
  selected: boolean,
};
type EntryComponent<Item> = React$ComponentType<EntryProps<Item>>;

type Opts<Item> = {
  id: string,
  itemEventProperties: Item => ?Object,
  keyExtractor: Item => string,
  formatItem?: Item => string,
  Entry?: EntryComponent<Item>,
  navigationOptions?: Object,
  ListHeaderComponent?: any,
  // TODO in future: searchable: boolean
};

function getEntryFromOptions<Item>(opts: Opts<Item>): EntryComponent<Item> {
  if (opts.Entry) return opts.Entry;
  const { formatItem } = opts;
  if (!formatItem) {
    throw new Error("formatItem is required if Entry is not provided");
  }
  return class DefaultEntry extends Component<EntryProps<Item>> {
    onPress = () => this.props.onPress(this.props.item);

    render() {
      const { item, selected } = this.props;
      return (
        <SettingsRow
          title={formatItem(item)}
          onPress={this.onPress}
          selected={!!selected}
          compact
        />
      );
    }
  };
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});

export default <Item>(opts: Opts<Item>) => {
  const { id, itemEventProperties, keyExtractor } = opts;
  const Entry: EntryComponent<Item> = getEntryFromOptions(opts);

  return class GenericSelectScreen extends Component<{
    selectedKey: string,
    items: Item[],
    onValueChange: (Item, *) => void,
    navigation: any,
    cancelNavigateBack: ?boolean,
  }> {
    onPress = (item: Item) => {
      const { navigation, onValueChange, cancelNavigateBack } = this.props;
      onValueChange(item, this.props);
      if (!cancelNavigateBack) {
        navigation.goBack();
      }
      track(id, itemEventProperties(item));
    };

    renderItem = ({ item }: { item: Item }) => (
      <Entry
        onPress={this.onPress}
        item={item}
        selected={keyExtractor(item) === this.props.selectedKey}
      />
    );

    render() {
      return (
        <FlatList
          ListHeaderComponent={opts.ListHeaderComponent}
          data={this.props.items}
          renderItem={this.renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.root}
        />
      );
    }
  };
};
