/* @flow */
import React, { Component, Fragment } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "../components/Touchable";
import CreateModal from "../modals/Create";
import colors from "../colors";
import TransferIcon from "../icons/Transfer";

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
});

class Transfer extends Component<null, { isModalOpened: boolean }> {
  state = {
    isModalOpened: false,
  };

  openModal = () => this.setState({ isModalOpened: true });

  onModalClose = () => this.setState({ isModalOpened: false });

  render() {
    const { isModalOpened } = this.state;
    return (
      <Fragment>
        <Touchable onPress={this.openModal}>
          <View style={styles.root}>
            <TransferIcon size={18} color={colors.grey} />
          </View>
        </Touchable>
        <CreateModal isOpened={isModalOpened} onClose={this.onModalClose} />
      </Fragment>
    );
  }
}

export default class Create extends Component<*> {
  static navigationOptions = {
    tabBarIcon: (props: *) => <Transfer {...props} />,
    tabBarOnPress: () => {}, // noop
  };

  render() {
    return null;
  }
}
