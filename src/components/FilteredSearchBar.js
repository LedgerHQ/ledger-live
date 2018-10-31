// @flow
import React, { PureComponent, Fragment } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import SearchIcon from "../icons/Search";
import Search from "./Search";
import InputResetCross from "./InputResetCross";
import getFontStyle from "./LText/getFontStyle";

import colors from "../colors";

type Props = {
  renderList: (list: Array<*>) => React$Node,
  renderEmptySearch: () => React$Node,
  keys?: Array<string>,
  list: Array<*>,
  inputWrapperStyle?: *,
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

  input = React.createRef();

  onFocus = () => this.setState({ focused: true });

  onBlur = () => this.setState({ focused: false });

  onChange = (text: string) => this.setState({ query: text });

  clear = () => {
    if (this.input.current) {
      this.input.current.clear();
    }
    this.onChange("");
  };

  render() {
    const {
      keys,
      renderList,
      list,
      renderEmptySearch,
      inputWrapperStyle,
    } = this.props;
    const { query, focused } = this.state;

    return (
      <Fragment>
        <View style={[styles.wrapper, inputWrapperStyle]}>
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
          {query ? <InputResetCross onPress={this.clear} /> : null}
        </View>
        <Search
          fuseOptions={{
            threshold: 0.1,
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
  input: {
    flex: 1,
    fontSize: 18,
    color: colors.darkBlue,
    ...getFontStyle({ secondary: true, semiBold: true }),
  },
});

export default FilteredSearchBar;
