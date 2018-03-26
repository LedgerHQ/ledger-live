/* @flow */
import React, { Component } from "react";
import { Image, View, StyleSheet } from "react-native";
import Touchable from "../components/Touchable";
import CreateModal from "../modals/Create";
import colors from "../colors";

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4
  },
  view: {
    backgroundColor: colors.blue,
    paddingVertical: 0,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center"
  },
  image: {
    tintColor: "#fff",
    width: 32,
    height: 32
  }
});

class Icon extends Component<*, *> {
  state = {
    modalOpened: false
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
          <View style={styles.view}>
            <Image
              source={require("../images/create.png")}
              style={styles.image}
            />
          </View>
          {modalOpened ? (
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
    tabBarOnPress: () => {} // noop
  };
  render() {
    return null;
  }
}
