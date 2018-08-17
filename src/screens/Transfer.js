/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "../components/Touchable";
import CreateModal from "../modals/Create";
import colors from "../colors";
import TransferIcon from "../images/icons/Transfer";

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
});

class Icon extends Component<*, *> {
  state = {
    modalOpened: false,
  };
  onPress = () => {
    this.setState({ modalOpened: true });
  };
  onRequestClose = () => {
    this.setState({ modalOpened: false });
  };
  render() {
    const { modalOpened } = this.state;
    return (
      <Touchable onPress={this.onPress}>
        <View style={styles.root}>
          <TransferIcon size={18} color={colors.grey} />
          {modalOpened ? (
            // $FlowFixMe
            <CreateModal onRequestClose={this.onRequestClose} />
          ) : null}
        </View>
      </Touchable>
    );
  }
}

export default class Create extends Component<*> {
  static navigationOptions = {
    tabBarIcon: (props: *) => <Icon {...props} />,
    tabBarOnPress: () => {}, // noop
  };
  render() {
    return null;
  }
}
