/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { getAccountOperationExplorer } from "@ledgerhq/live-common/lib/explorers";
import type { NavigationScreenProp } from "react-navigation";
import Footer from "./Footer";
import Content from "./Content";
import colors from "../../colors";
import HeaderRightClose from "../../components/HeaderRightClose";

type Props = {
  navigation: NavigationScreenProp<{
    account: Account,
    operation: Operation,
  }>,
};
class OperationDetails extends PureComponent<Props, *> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Operation Details",
    headerRight: <HeaderRightClose navigation={navigation} />,
    headerLeft: null,
  });

  render() {
    const { navigation } = this.props;
    const account = navigation.getParam("account", {});
    const operation = navigation.getParam("operation", {});

    const url = getAccountOperationExplorer(account, operation);
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.root}>
            <Content account={account} operation={operation} />
          </View>
        </ScrollView>
        {url && <Footer url={url} />}
      </SafeAreaView>
    );
  }
}

export default OperationDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  root: {
    paddingTop: 24,
    paddingBottom: 64,
  },
});
