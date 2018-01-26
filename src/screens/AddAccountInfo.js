/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Image,
  Button
} from "react-native";
import colors from "../colors";
import HeaderRightClose from "../components/HeaderRightClose";
import BlueButton from "../components/BlueButton";

export default class AddAccountInfo extends Component<*> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Add an account",
    headerRight: <HeaderRightClose navigation={navigation} />
  });
  onSelect = () => {
    const { screenProps: { parentNavigation } } = this.props;
    parentNavigation.goBack();
  };
  render() {
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <Text>Currency={this.props.navigation.state.params.currency}</Text>
          <Text>Account name will be filled here... TODO</Text>
        </View>
        <BlueButton onPress={this.onSelect} title="Confirm account" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  body: {
    flex: 1
  }
});
