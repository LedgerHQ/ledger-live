/* @flow */
import React, { Component } from "react";
import { FlatList } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../components/SettingsRow";

type Item<T> = {
  label: string,
  value: T
};

type Opts<T> = {
  title: string,
  keyExtractor?: (Item<T>) => string,
  items: Item<T>[]
};

const defaultOpts = {
  keyExtractor: item => String(item.value)
};

export default <T>(opts: Opts<T>) => {
  const { title, keyExtractor, items } = { ...opts, ...defaultOpts };

  class Entry extends Component<{
    item: Item<T>,
    onPress: (Item<T>) => void
  }> {
    onPress = () => this.props.onPress(this.props.item);
    render() {
      const { item } = this.props;
      return <SettingsRow title={item.label} onPress={this.onPress} />;
    }
  }

  return class GenericSelectScreen extends Component<{
    value: T,
    onValueChange: T => void,
    navigation: NavigationScreenProp<*>
  }> {
    static navigationOptions = { title };

    onPress = (item: Item<T>) => {
      const { navigation, onValueChange } = this.props;
      onValueChange(item.value);
      navigation.goBack();
    };

    renderItem = ({ item }: { item: Item<T> }) => (
      <Entry onPress={this.onPress} item={item} />
    );

    render() {
      return (
        <FlatList
          data={items}
          renderItem={this.renderItem}
          keyExtractor={keyExtractor}
        />
      );
    }
  };
};
