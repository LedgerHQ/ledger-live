// @flow
import React, { Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";

import LText from "../../components/LText/index";
import Check from "../../images/icons/Check";

import colors from "../../colors";

type Props = {
  title: string,
  last?: boolean,
  value: number,
  currentValue: number,
  onPress: number => void,
};

type State = {};

class FeesRow extends Component<Props, State> {
  static defaultProps = {
    link: "",
    last: false,
  };

  onPress = () => {
    const { value, onPress } = this.props;
    onPress(value);
  };

  render(): React$Node {
    const { title, last, currentValue, value } = this.props;
    const isSelected = currentValue === value;
    return (
      <TouchableOpacity onPress={this.onPress}>
        <View style={[styles.root, last ? styles.last : null]}>
          <View
            style={[
              styles.iconContainer,
              isSelected ? styles.iconContainerSelected : null,
            ]}
          >
            {isSelected ? <Check size={14} color={colors.white} /> : null}
          </View>
          <View style={styles.titleContainer}>
            <LText
              semiBold={isSelected}
              style={[styles.title, isSelected ? styles.titleSelected : null]}
            >
              {title}
            </LText>
          </View>
          <View>
            <LText
              style={styles.text}
              semiBold={isSelected}
            >{`${value} Sat/bytes`}</LText>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    paddingRight: 16,
    paddingVertical: 16,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
  },
  last: {
    borderBottomWidth: 0,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  title: {
    fontSize: 14,
    color: colors.grey,
  },
  titleSelected: {
    color: colors.darkBlue,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.fog,
    borderRadius: 50,
    marginRight: 16,
  },
  iconContainerSelected: {
    justifyContent: "center",
    alignItems: "center",
    borderColor: colors.live,
    backgroundColor: colors.live,
  },
  text: {
    color: colors.darkBlue,
  },
});

export default FeesRow;
