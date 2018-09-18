/* @flow */
import React, { PureComponent } from "react";
import { ScrollView, FlatList, View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import type { T } from "../../types/common";
import SettingsRow from "../../components/SettingsRow";
import Touchable from "../../components/Touchable";

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  updateAccount: Function,
  account: Account,
  t: T,
};

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});
const mapDispatchToProps = {
  updateAccount,
};
class EditAccountUnits extends PureComponent<Props> {
  static navigationOptions = {
    title: "Edit Units",
  };

  keyExtractor = (item: any) => item.code;

  updateAccount = (item: any) => {
    const { account, navigation, updateAccount } = this.props;
    const updatedAccount = {
      ...account,
      unit: item,
    };
    updateAccount(updatedAccount);
    navigation.goBack();
  };

  render() {
    const { account } = this.props;
    const accountUnits = account.currency.units;
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.body}>
          <FlatList
            data={accountUnits}
            keyExtractor={this.keyExtractor}
            renderItem={({ item }) => (
              <Touchable
                onPress={() => {
                  this.updateAccount(item);
                }}
              >
                <SettingsRow
                  title={item.code}
                  selected={account.unit.code === item.code}
                />
              </Touchable>
            )}
          >
            {account.unit.code}
          </FlatList>
        </View>
      </ScrollView>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(EditAccountUnits);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
  body: {
    flexDirection: "column",
    flex: 1,
  },
});
