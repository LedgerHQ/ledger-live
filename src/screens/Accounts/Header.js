/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Image } from "react-native";
import Touchable from "../../components/Touchable";
import LText from "../../components/LText";

class Accounts extends PureComponent<{
  expandedMode: boolean,
  onToggleExpandedMode: () => ?Promise<*>,
  onAddAccount: () => ?Promise<*>,
  title: string
}> {
  render() {
    const {
      expandedMode,
      onToggleExpandedMode,
      onAddAccount,
      title
    } = this.props;
    return (
      <View style={styles.header}>
        <Touchable onPress={onToggleExpandedMode}>
          <Image
            source={
              expandedMode
                ? require("../../images/accountsmenutoggled.png")
                : require("../../images/accountsmenu.png")
            }
            style={{ width: 24, height: 20 }}
          />
        </Touchable>
        <LText style={styles.headerText}>{title}</LText>
        <Touchable onPress={onAddAccount}>
          <Image
            source={require("../../images/accountsplus.png")}
            style={{ width: 22, height: 21 }}
          />
        </Touchable>
      </View>
    );
  }
}

export default Accounts;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    flex: 1
  },
  headerText: {
    color: "white",
    fontSize: 16
  }
});
