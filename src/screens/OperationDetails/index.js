/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import HeaderRightClose from "../../components/HeaderRightClose";

type Nav = NavigationScreenProp<{
  params: {
    accountId: string,
    operationId: string,
    mainNavigation: NavigationScreenProp<*>
  }
}>;

type Props = {
  navigation: Nav
  // TODO operation and account in props via connect mapping from the ids
};

class OperationDetails extends Component<Props> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Operation Details",
    headerRight: <HeaderRightClose navigation={navigation} />,
    headerLeft: null
  });

  render() {
    return <View style={styles.container} />;
  }
}

export default OperationDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  }
});
