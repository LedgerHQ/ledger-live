// @flow

import React, { PureComponent } from "react";
import { compose } from "redux";
import {
  ScrollView,
  StyleSheet,
  SectionList,
  View,
  Animated,
} from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import { groupAccountOperationsByDay } from "@ledgerhq/live-common/lib/helpers/account";
import type { Account, Operation, Unit } from "@ledgerhq/live-common/lib/types";
import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import { accountScreenSelector } from "../../reducers/accounts";

import OperationRow from "./../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";
import LText from "../../components/LText";
import GraphCard from "../../components/GraphCard";
import LoadingFooter from "../../components/LoadingFooter";
import colors from "./../../colors";
import provideSummary from "../../components/provideSummary";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";

import type { Item } from "../../components/Graph";
import type { Summary } from "../../components/provideSummary";

import EmptyStateAccount from "./EmptyStateAccount";
import AccountTopBar from "./AccountTopBar";

type Props = {
  account: Account,
  summary: Summary,
  navigation: NavigationScreenProp<{ accountId: string }>,
};

type State = {
  opCount: number,
  scrollEnabled: boolean,
  scrollY: AnimatedValue,
};

const List = Animated.createAnimatedComponent(SectionList);

const isAccountEmpty = (a: Account): boolean =>
  a.operations.length === 0 && a.balance.isZero();

class AccountScreen extends PureComponent<Props, State> {
  static navigationOptions = () => ({
    header: null,
  });

  state = {
    opCount: 100,
    scrollEnabled: true,
    scrollY: new Animated.Value(0),
  };

  disableScroll = () => this.setState({ scrollEnabled: false });
  enableScroll = () => this.setState({ scrollEnabled: true });

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

  renderListHeaderTitle = ({
    counterValueUnit,
    item,
  }: {
    counterValueUnit: Unit,
    item: Item,
  }) => (
    <View style={styles.balanceContainer}>
      <LText style={styles.balanceText} tertiary>
        <CurrencyUnitValue
          unit={this.props.account.unit}
          value={item.originalValue}
        />
      </LText>
      <LText style={styles.balanceSubText} tertiary>
        <CurrencyUnitValue unit={counterValueUnit} value={item.value} />
      </LText>
    </View>
  );

  ListHeaderComponent = () => {
    const { summary } = this.props;
    return (
      <GraphCard
        style={styles.header}
        summary={summary}
        onPanResponderStart={this.disableScroll}
        onPanResponderRelease={this.enableScroll}
        renderTitle={this.renderListHeaderTitle}
      />
    );
  };

  render() {
    const { account, navigation } = this.props;
    const { opCount, scrollEnabled, scrollY } = this.state;
    if (!account) return null;

    const { sections, completed } = groupAccountOperationsByDay(
      account,
      opCount,
    );

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ flex: 1 }}>
        {!isAccountEmpty(account) ? (
          <List
            sections={sections}
            style={styles.sectionList}
            scrollEnabled={scrollEnabled}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            ListFooterComponent={
              !completed
                ? LoadingFooter
                : sections.length === 0
                  ? NoOperationFooter
                  : NoMoreOperationFooter
            }
            ListHeaderComponent={this.ListHeaderComponent}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
            renderSectionHeader={SectionHeader}
            onEndReached={this.onEndReached}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyStateAccount account={account} navigation={navigation} />
        )}
        <AccountTopBar
          account={account}
          navigation={navigation}
          scrollY={scrollY}
        />
      </ScrollView>
    );
  }
}

export default compose(
  connect(
    createStructuredSelector({
      account: accountScreenSelector,
    }),
  ),
  provideSummary,
)(AccountScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  header: {
    marginTop: 80,
  },
  sectionList: { flex: 1 },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 22,
    color: colors.darkBlue,
  },
  balanceSubText: {
    fontSize: 16,
    color: colors.smoke,
  },
});
