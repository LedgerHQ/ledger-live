// @flow

import React, { PureComponent } from "react";
import { compose } from "redux";
import { StyleSheet, SectionList, View, Animated } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import { groupAccountOperationsByDay } from "@ledgerhq/live-common/lib/helpers/account";
import type { Account, Operation, Unit } from "@ledgerhq/live-common/lib/types";

import { accountScreenSelector } from "../../reducers/accounts";
import { accountScreenSyncStateSelector } from "../../reducers/bridgeSync";
import type { AsyncState } from "../../reducers/bridgeSync";
import provideSyncRefreshControl from "../../components/provideSyncRefreshControl";
import OperationRow from "../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";
import LText from "../../components/LText";
import GraphCard from "../../components/GraphCard";
import LoadingFooter from "../../components/LoadingFooter";
import colors from "../../colors";
import provideSummary from "../../components/provideSummary";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import SyncErrorHeader from "../../components/SyncErrorHeader";

import type { Item } from "../../components/Graph";
import type { Summary } from "../../components/provideSummary";

import EmptyStateAccount from "./EmptyStateAccount";
import AccountHeaderRight from "./AccountHeaderRight";
import AccountHeaderTitle from "./AccountHeaderTitle";
import { scrollToTopIntent } from "./events";

type Props = {
  account: Account,
  syncState: AsyncState,
  summary: Summary,
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
};

type State = {
  opCount: number,
  scrollEnabled: boolean,
};

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = provideSyncRefreshControl(AnimatedSectionList);

const isAccountEmpty = (a: Account): boolean =>
  a.operations.length === 0 && a.balance.isZero();

class AccountScreen extends PureComponent<Props, State> {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: <AccountHeaderTitle navigation={navigation} />,
    headerRight: <AccountHeaderRight navigation={navigation} />,
  });

  state = {
    opCount: 100,
    scrollEnabled: true,
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
        summary={summary}
        onPanResponderStart={this.disableScroll}
        onPanResponderRelease={this.enableScroll}
        renderTitle={this.renderListHeaderTitle}
      />
    );
  };

  ref = React.createRef();

  componentDidMount() {
    this.scrollSub = scrollToTopIntent.subscribe(() => {
      const sectionList = this.ref.current;
      if (sectionList) {
        sectionList.getScrollResponder().scrollTo({
          x: 0,
          y: 0,
          animated: true,
        });
      }
    });
  }

  componentWillUnmount() {
    this.scrollSub.unsubscribe();
  }

  scrollSub: *;

  onPress = () => {
    scrollToTopIntent.next();
  };

  render() {
    const { account, navigation, syncState } = this.props;
    const { opCount, scrollEnabled } = this.state;

    if (!account) return null;

    if (isAccountEmpty(account)) {
      return <EmptyStateAccount account={account} navigation={navigation} />;
    }

    const { error } = syncState;

    const { sections, completed } = groupAccountOperationsByDay(
      account,
      opCount,
    );

    return (
      <View style={styles.root}>
        {error ? (
          <SyncErrorHeader error={error} onPress={this.onPress} />
        ) : null}
        <List
          ref={this.ref}
          sections={sections}
          style={styles.sectionList}
          scrollEnabled={scrollEnabled}
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
          provideSyncRefreshControlBehavior={{
            type: "SYNC_ONE_ACCOUNT",
            accountId: account.id,
            priority: 10,
          }}
          contentContainerStyle={styles.contentContainer}
        />
      </View>
    );
  }
}

export default compose(
  connect(
    createStructuredSelector({
      account: accountScreenSelector,
      syncState: accountScreenSyncStateSelector,
    }),
  ),
  provideSummary,
)(AccountScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  sectionList: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
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
  contentContainer: {
    paddingBottom: 64,
  },
});
