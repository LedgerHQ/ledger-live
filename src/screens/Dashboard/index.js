// @flow

import React, { Component } from "react";
import { Image, View, StyleSheet, StatusBar, SectionList } from "react-native";
import { connect } from "react-redux";

import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { groupAccountsOperationsByDay } from "@ledgerhq/live-common/lib/helpers/account";

import { accountsSelector } from "../../reducers/accounts";

import colors from "../../colors";

import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";
import LoadingFooter from "../../components/LoadingFooter";
import LText from "../../components/LText";
import DashboardHeader from "./DashboardHeader";
import OperationRow from "./OperationRow";

const navigationOptions = {
  tabBarIcon: ({ tintColor }: *) => (
    <Image
      source={require("../../images/dashboard.png")}
      style={{ tintColor, width: 32, height: 32 }}
    />
  ),
};

const mapStateToProps = state => ({ accounts: accountsSelector(state) });

class Dashboard extends Component<
  {
    accounts: Account[],
    navigation: *,
  },
  {
    opCount: number,
  },
> {
  static navigationOptions = navigationOptions;

  state = {
    opCount: 50,
  };

  keyExtractor = (item: Operation) => item.id;

  renderItem = ({ item }: { item: Operation }) => {
    const account = this.props.accounts.find(a => a.id === item.accountId);

    if (!account) return null;

    return <OperationRow operation={item} account={account} />;
  };

  onEndReached = () => {
    this.setState(({ opCount }) => ({ opCount: opCount + 50 }));
  };

  render() {
    const { accounts } = this.props;
    const { opCount } = this.state;

    if (accounts.length === 0) {
      return (
        <View style={styles.root}>
          <LText>No account</LText>
        </View>
      );
    }

    const { sections, completed } = groupAccountsOperationsByDay(
      accounts,
      opCount,
    );

    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <DashboardHeader>
          <SectionList
            sections={(sections: any)}
            style={styles.sectionList}
            ListFooterComponent={
              !completed
                ? LoadingFooter
                : sections.length === 0
                  ? NoOperationFooter
                  : NoMoreOperationFooter
            }
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
            renderSectionHeader={SectionHeader}
            onEndReached={this.onEndReached}
            showsVerticalScrollIndicator={false}
          />
        </DashboardHeader>
      </View>
    );
  }
}

export default connect(mapStateToProps)(Dashboard);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  sectionList: {
    flex: 1,
  },
});
