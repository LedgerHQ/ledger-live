import React, { Component, useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Box } from "@ledgerhq/native-ui";
import { StackNavigationProp } from "@react-navigation/stack";
import { track } from "~/analytics";
import SettingsRow from "~/components/SettingsRow";

type EntryProps<Item> = {
  item: Item;
  onPress: (value: Item) => void;
  selected: boolean;
};
type EntryComponent<Item> = React.ComponentType<EntryProps<Item>>;

type Opts<Item> = {
  id: string;
  itemEventProperties: (_: Item) => Record<string, unknown>;
  keyExtractor: (_: Item) => string;
  formatItem?: (_: Item) => React.ReactNode;
  Entry?: EntryComponent<Item>;
  ListHeaderComponent?: React.ComponentType;
  // TODO in future: searchable: boolean
};

function getEntryFromOptions<Item>(opts: Opts<Item>): EntryComponent<Item> {
  if (opts.Entry) return opts.Entry;
  const { formatItem } = opts;
  if (!formatItem) {
    throw new Error("formatItem is required if Entry is not provided");
  }

  const DefaultEntry = ({ onPress, item, selected }: EntryProps<Item>) => {
    const onPressAction = useCallback(() => {
      onPress(item);
    }, [onPress, item]);

    return (
      <SettingsRow title={formatItem(item)} onPress={onPressAction} selected={!!selected} compact />
    );
  };

  return DefaultEntry;
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingBottom: 64,
  },
});

type GenericScreenProps<Item> = {
  selectedKey?: string;
  items: Item[];
  onValueChange: (items: Item, props: GenericScreenProps<Item>) => void;
  navigation: StackNavigationProp<{ [key: string]: object }>;
  cancelNavigateBack?: boolean;
};

export default function makeGenericSelectScreen<Item extends { value: string; label: string }>(
  opts: Opts<Item>,
) {
  const { id, itemEventProperties, keyExtractor } = opts;
  const Entry: EntryComponent<Item> = getEntryFromOptions(opts);

  return class GenericSelectScreen extends Component<GenericScreenProps<Item>> {
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
        <Box backgroundColor={"background.main"} px={6}>
          <FlatList
            ListHeaderComponent={opts.ListHeaderComponent}
            data={this.props.items}
            renderItem={this.renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.root}
          />
        </Box>
      );
    }
  };
}
