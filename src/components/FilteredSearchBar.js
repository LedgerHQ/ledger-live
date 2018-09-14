// @flow
import React, { PureComponent, Fragment } from "react";
import { StyleSheet, TextInput, View, TouchableOpacity } from "react-native";
import throttle from "lodash/throttle";

import Search from "./Search";
import SearchIcon from "../icons/Search";
import Close from "../icons/Close";

import colors from "../colors";

type Props = {
  renderList: (list: Array<*>) => React$Node,
  renderEmptySearch: () => React$Node,
  keys?: Array<string>,
  list: Array<*>,
};

type State = {
  focused: boolean,
  query: string,
};

class FilteredSearchBar extends PureComponent<Props, State> {
  static defaultProps = {
    keys: ["name"],
  };

  state = {
    focused: false,
    query: "",
  };

  // $FlowFixMe
  input = React.createRef();

  componentWillUnmount() {
    this.onChange.cancel();
  }

  onFocus = () => this.setState({ focused: true });
  onBlur = () => this.setState({ focused: false });

  onChange = throttle((text: string) => this.setState({ query: text }), 200);

  clear = () => {
    this.onChange.cancel();
    this.input.current.clear();
    this.onChange("");
  };

  render() {
    const { keys, renderList, list, renderEmptySearch } = this.props;
    const { query, focused } = this.state;

    return (
      <Fragment>
        <View style={styles.wrapper}>
          <View style={styles.iconContainer}>
            <SearchIcon
              size={16}
              color={focused ? colors.darkBlue : colors.fog}
            />
          </View>
          <TextInput
            onBlur={this.onBlur}
            onFocus={this.onFocus}
            onChangeText={this.onChange}
            placeholder="Search"
            placeholderTextColor={colors.fog}
            style={styles.input}
            value={query}
            ref={this.input}
          />
          {!!query && (
            <TouchableOpacity onPress={this.clear}>
              <View style={styles.closeContainer}>
                <Close color={colors.white} size={8} />
              </View>
            </TouchableOpacity>
          )}
        </View>
        <Search
          fuseOptions={{
            threshold: 0.5,
            keys,
          }}
          value={query}
          items={list}
          render={items => renderList(items)}
          renderEmptySearch={renderEmptySearch}
        />
      </Fragment>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconContainer: {
    marginRight: 16,
  },
  crossContainer: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Museo Sans",
    fontWeight: "500",
    color: colors.darkBlue,
  },
  closeContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 12,
    height: 12,
    borderRadius: 12,
    backgroundColor: colors.fog,
    marginLeft: 6,
  },
});

export default FilteredSearchBar;
