// @flow
import React, { Component } from "react";
import { Trans } from "react-i18next";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { BigNumber } from "bignumber.js";

import LText from "../../../components/LText/index";
import Check from "../../../icons/Check";
import { withTheme } from "../../../colors";

type Props = {
  title: React$Node,
  last?: boolean,
  value: BigNumber,
  isSelected: boolean,
  itemKey: string,
  onPress: (BigNumber, string) => void,
  colors: *,
};

type State = {
  // TODO calculate and store the fees amount to display it
};

class FeesRow extends Component<Props, State> {
  static defaultProps = {
    link: "",
    last: false,
  };

  onPress = () => {
    const { value, onPress, itemKey } = this.props;
    onPress(value, itemKey);
  };

  render() {
    const { title, last, isSelected, value, colors } = this.props;
    return (
      <TouchableOpacity onPress={this.onPress}>
        <View
          style={[
            styles.root,
            { borderBottomColor: colors.lightFog },
            last ? styles.last : null,
          ]}
        >
          <View
            style={[
              styles.iconContainer,
              isSelected
                ? {
                    ...styles.iconContainerSelected,
                    borderColor: colors.live,
                    backgroundColor: colors.live,
                  }
                : { borderColor: colors.fog },
            ]}
          >
            {isSelected ? <Check size={14} color={colors.white} /> : null}
          </View>
          <View style={styles.titleContainer}>
            <LText
              semiBold={isSelected}
              style={[styles.title]}
              color={isSelected ? "darkBlue" : "grey"}
            >
              {title}
            </LText>
          </View>
          <View>
            <LText style={styles.text} semiBold={isSelected}>
              {`${value.toString()} `}
              <Trans i18nKey="common.satPerByte" />
            </LText>
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
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderWidth: 1,

    borderRadius: 50,
    marginRight: 16,
  },
  iconContainerSelected: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {},
});

export default withTheme(FeesRow);
