// @flow
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import ExternalLink from "../../icons/ExternalLink";

import LText from "../../components/LText/index";

import colors from "../../colors";

type Props = {
  title: string,
  link?: string,
  children: React$Node,
  last?: boolean,
};

type State = {};

class SummaryRow extends Component<Props, State> {
  static defaultProps = {
    link: "",
    last: false,
  };

  render(): React$Node {
    const { title, link, children, last } = this.props;
    return (
      <View style={[styles.root, last ? styles.last : null]}>
        <View style={styles.titleContainer}>
          <LText style={styles.title}>{title}</LText>
          <View style={styles.iconContainer}>
            {!!link && (
              <ExternalLink
                name="external-link"
                size={12}
                color={colors.grey}
              />
            )}
          </View>
        </View>
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 16,
    paddingRight: 16,
    paddingVertical: 24,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
  },
  last: {
    borderBottomWidth: 0,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  title: {
    fontSize: 12,
    color: colors.grey,
  },
  iconContainer: {
    paddingLeft: 6,
  },
});

export default SummaryRow;
