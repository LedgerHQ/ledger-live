// @flow

import React, { Component } from "react";
import { ScrollView, StyleSheet, SectionList } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import { groupAccountOperationsByDay } from "@ledgerhq/live-common/lib/helpers/account";
import type { Account, Operation } from "@ledgerhq/live-common/lib/types";
import { accountScreenSelector } from "../../reducers/accounts";

import OperationRow from "./../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";
import LoadingFooter from "../../components/LoadingFooter";

import colors from "./../../colors";

type Props = {
  account: ?Account,
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
};

type State = {
  opCount: number,
};

class Accnt extends Component<Props, State> {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.getParam("accountTitle", "Account"),
  });

  state = {
    opCount: 50,
  };

  componentDidMount() {
    const { account, navigation } = this.props;
    if (account) {
      navigation.setParams({ accountTitle: `Account ${account.name}` });
    }
  }

  keyExtractor = (item: Operation) => item.id;

  renderItem = ({ item }: { item: Operation }) => {
    const { account, navigation } = this.props;

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        account={account}
        navigation={navigation}
      />
    );
  };

  onEndReached = () => {
    this.setState(({ opCount }) => ({ opCount: opCount + 50 }));
  };

  render() {
    const { account } = this.props;
    const { opCount } = this.state;
    if (!account) return null;

    const { sections, completed } = groupAccountOperationsByDay(
      account,
      opCount,
    );

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
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
      </ScrollView>
    );
  }
}

export default connect(
  createStructuredSelector({
    account: accountScreenSelector,
  }),
)(Accnt);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightGrey },
  sectionList: { flex: 1 },
});
