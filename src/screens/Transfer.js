/* @flow */
import React, { Component, Fragment } from "react";
import { View, StyleSheet } from "react-native";
import Touchable from "../components/Touchable";
import CreateModal from "../modals/Create";
import TransferIcon from "../icons/Transfer";
import defaultNavigationOptions from "./defaultNavigationOptions";
import ExchangeScreen from "./Exchange";

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
});

const hitSlop = {
  top: 10,
  left: 25,
  right: 25,
  bottom: 25,
};

class Transfer extends Component<
  { tintColor: string },
  { isModalOpened: boolean },
> {
  state = {
    isModalOpened: false,
  };

  openModal = () => this.setState({ isModalOpened: true });

  onModalClose = () => this.setState({ isModalOpened: false });

  render() {
    const { isModalOpened } = this.state;
    return (
      <Fragment>
        <Touchable hitSlop={hitSlop} onPress={this.openModal}>
          <View style={styles.root}>
            <TransferIcon size={18} color={this.props.tintColor} />
          </View>
        </Touchable>
        <CreateModal isOpened={isModalOpened} onClose={this.onModalClose} />
      </Fragment>
    );
  }
}

export default class Create extends Component<*> {
  static navigationOptions = {
    ...defaultNavigationOptions,
    tabBarIcon: (props: *) => <Transfer {...props} />,
    tabBarOnPress: () => {}, // noop
  };

  render() {
    const { ...props } = this.props;
    return <ExchangeScreen {...props} />;
  }
}
