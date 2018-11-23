// @flow
import React, { PureComponent, Fragment } from "react";
import { StyleSheet, TextInput, View, TouchableOpacity } from "react-native";
import { translate } from "react-i18next";

import SearchIcon from "../icons/Search";
import Search from "./Search";
import InputResetCross from "./InputResetCross";
import getFontStyle from "./LText/getFontStyle";

import colors from "../colors";
import type { T } from "../types/common";

type Props = {
  renderList: (list: Array<*>) => React$Node,
  renderEmptySearch: () => React$Node,
  keys?: Array<string>,
  list: Array<*>,
  inputWrapperStyle?: *,
  t: T,
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

  focusInput = () => {
    if (this.input.current) {
      this.input.current.focus();
    }
  };

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
      t,
    } = this.props;
    const { query, focused } = this.state;

    return (
      <Fragment>
        <TouchableOpacity
          onPress={this.focusInput}
          style={[styles.wrapper, inputWrapperStyle]}
        >
          <View style={styles.iconContainer}>
            <SearchIcon
              size={20}
              color={focused ? colors.darkBlue : colors.grey}
            />
          </View>
          <TextInput
            onBlur={this.onBlur}
            onFocus={this.onFocus}
            onChangeText={this.onChange}
            placeholder={t("common.search")}
            placeholderTextColor={colors.grey}
            style={styles.input}
            value={query}
            ref={this.input}
            autoCorrect={false}
          />
          {query ? <InputResetCross onPress={this.clear} /> : null}
        </TouchableOpacity>
        <Search
          fuseOptions={{
            threshold: 0.1,
            keys,
          }}
          value={query}
          items={list}
          render={renderList}
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
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.darkBlue,
    paddingVertical: 0,
    ...getFontStyle({ secondary: true, semiBold: true }),
  },
});

export default translate()(FilteredSearchBar);
