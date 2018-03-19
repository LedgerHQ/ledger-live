/* @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { View, StyleSheet, ScrollView, FlatList } from "react-native";
import type { NavigationScreenProp } from "react-navigation";

import { updateAccount } from "../../actions/accounts";
import UnitRow from "../../components/UnitRow";
import type { Account } from "../../types/common";

const mapStateToProps = () => ({});

const mapDispatchToProps = {
  updateAccount
};

class EditUnits extends Component<{
  updateAccount: ($Shape<Account>) => *,
  navigation: NavigationScreenProp<{
    params: {
      account: Account
    },
    goBack: () => void
  }>
}> {
  static navigationOptions = {
    title: "Edit Units"
  };
  onItemFullPress = (item: *) => {
    const { account } = this.props.navigation.state.params;
    const { navigation, updateAccount } = this.props;
    updateAccount({ unit: item, id: account.id });
    navigation.goBack();
  };

  keyExtractor = (item: *) => item.code;

  renderItem = ({ item }: *) => (
    <UnitRow unit={item} onPress={() => this.onItemFullPress(item)} />
  );

  render() {
    const { account } = this.props.navigation.state.params;
    return (
      <View>
        <ScrollView style={styles.container} />
        <View style={styles.header} />
        <FlatList
          data={account.currency.units}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
        />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  body: {
    marginTop: -50,
    alignItems: "center"
  },
  avatar: {
    width: 100,
    height: 100
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(EditUnits);
