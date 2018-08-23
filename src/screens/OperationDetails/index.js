/* @flow */
import React, { PureComponent, Fragment } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { getAccountOperationExplorer } from "@ledgerhq/live-common/lib/explorers";
import type { NavigationScreenProp } from "react-navigation";
import Footer from "./Footer";
import Content from "./Content";
import HeaderRightClose from "../../components/HeaderRightClose";

type Props = {
  navigation: NavigationScreenProp<{
    account: Account,
    operation: Operation,
  }>,
};
class OperationDetails extends PureComponent<Props, *> {
  static navigationOptions = ({ screenProps }: *) => ({
    title: "Operation Details",
    headerLeft: (
      <HeaderRightClose navigation={screenProps.topLevelNavigation} />
    ),
  });
  render() {
    const { navigation } = this.props;
    const account = navigation.getParam("account", {});
    const operation = navigation.getParam("operation", {});

    const url = getAccountOperationExplorer(account, operation);
    return (
      <Fragment>
        <ScrollView>
          <View style={styles.root}>
            <Content account={account} operation={operation} />
          </View>
        </ScrollView>
        {url && <Footer url={url} />}
      </Fragment>
    );
  }
}

export default OperationDetails;

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingTop: 20,
  },
});
