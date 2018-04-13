/* @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { View, FlatList } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Account } from "@ledgerhq/wallet-common/lib/types";

import { updateAccount } from "../../actions/accounts";
import UnitRow from "../../components/UnitRow";

const mapStateToProps = () => ({});

const mapDispatchToProps = {
  updateAccount
};

class EditUnits extends Component<{
  updateAccount: ($Shape<Account>) => *,
  navigation: NavigationScreenProp<{
    params: {
      account: Account
    }
  }>
}> {
  static navigationOptions = {
    title: "Edit Units"
  };
  onItemFullPress = (item: *) => {
    const { navigation, updateAccount } = this.props;
    const { account } = navigation.state.params;
    updateAccount({ unit: item, id: account.id });
    navigation.goBack();
  };

  keyExtractor = (item: *) => String(item.magnitude);

  renderItem = ({ item }: *) => (
    <UnitRow unit={item} onPress={() => this.onItemFullPress(item)} />
  );

  render() {
    const { account } = this.props.navigation.state.params;
    return (
      <View>
        <FlatList
          data={account.currency.units}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
        />
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditUnits);
