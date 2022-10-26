import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import LText, { Opts } from "../../components/LText/index";
import Touchable from "../../components/Touchable";

type Props = {
  title: React.ReactNode;
  titleProps?: Partial<Opts>;
  additionalInfo?: React.ReactNode;
  children: React.ReactNode;
  onPress?: () => void;
  event?: string;
};
// eslint-disable-next-line @typescript-eslint/ban-types
type State = {};

class SummaryRow extends Component<Props, State> {
  render(): React.ReactNode {
    const { title, children, titleProps, additionalInfo, onPress, event } =
      this.props;
    const titleContainer = (
      <View style={styles.titleContainer}>
        <LText style={[styles.title]} color="grey" {...titleProps}>
          {title}
        </LText>
        <View style={styles.iconContainer}>
          {!!additionalInfo && <View>{additionalInfo}</View>}
        </View>
      </View>
    );
    return (
      <View style={[styles.root]}>
        {onPress ? (
          <Touchable event={event || "SummaryRow"} onPress={onPress}>
            {titleContainer}
          </Touchable>
        ) : (
          titleContainer
        )}
        {children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  title: {
    fontSize: 14,
  },
  iconContainer: {
    paddingLeft: 6,
  },
});
export default SummaryRow;
