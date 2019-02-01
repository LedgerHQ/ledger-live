/* @flow */
import React, { PureComponent } from "react";
import i18next from "i18next";
import { ScrollView, FlatList, View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { accountScreenSelector } from "../../reducers/accounts";
import { updateAccount } from "../../actions/accounts";
import SettingsRow from "../../components/SettingsRow";
import Touchable from "../../components/Touchable";

type Props = {
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
  updateAccount: Function,
  account: Account,
};

const mapStateToProps = createStructuredSelector({
  account: accountScreenSelector,
});
const mapDispatchToProps = {
  updateAccount,
};
class EditAccountUnits extends PureComponent<Props> {
  static navigationOptions = {
    title: i18next.t("account.settings.accountUnits.title"),
    headerRight: null,
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
                event="EditAccountUnits"
                eventProperties={{
                  currency: account.currency.id,
                  unit: item.code,
                }}
                onPress={() => {
                  this.updateAccount(item);
                }}
              >
                <SettingsRow
                  title={item.code}
                  selected={account.unit.code === item.code}
                  compact
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
