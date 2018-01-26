/* @flow */
import React, { Component } from "react";
import { NavigationActions } from "react-navigation";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity
} from "react-native";
import colors from "../colors";
import WhiteButton from "../components/WhiteButton";
import HeaderRightText from "../components/HeaderRightText";

export default class SendFundsPlugDevice extends Component<*> {
  static navigationOptions = {
    title: "Plug your device",
    headerRight: <HeaderRightText>5 of 5</HeaderRightText>
  };
  onConfirm = () => {
    const { navigation } = this.props;
    // we are replacing the navigation so the next screen BACK action does not come back here.
    const action = NavigationActions.reset({
      index: 1,
      actions: [
        NavigationActions.navigate({ routeName: "Main" }), // TODO instead of this, preserve navigation stack
        NavigationActions.navigate({ routeName: "SendFundsConfirmation" })
      ]
    });
    navigation.dispatch(action);
  };
  render() {
    return (
      <ScrollView style={styles.root}>
        <View style={{ padding: 20 }}>
          <Text>Sign the transaction with the device...etc..</Text>
          <WhiteButton title="Confirm" onPress={this.onConfirm} />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.blue
  }
});
