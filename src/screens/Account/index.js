// @flow

import React, { PureComponent } from "react";
import { compose } from "redux";
import { StyleSheet, SectionList, View, Animated } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import { groupAccountOperationsByDay } from "@ledgerhq/live-common/lib/account";
import type { Account, Operation, Unit } from "@ledgerhq/live-common/lib/types";
import { accountScreenSelector } from "../../reducers/accounts";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
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
import type { Item } from "../../components/Graph";
import type { Summary } from "../../components/provideSummary";
import Header from "./Header";
import EmptyStateAccount from "./EmptyStateAccount";
import AccountHeaderRight from "./AccountHeaderRight";
import AccountHeaderTitle from "./AccountHeaderTitle";
import { scrollToTopIntent } from "./events";

type Props = {
  account: Account,
  summary: Summary,
  navigation: NavigationScreenProp<{
    accountId: string,
  }>,
};

type State = {
  opCount: number,
};

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = accountSyncRefreshControl(AnimatedSectionList);

const isAccountEmpty = (a: Account): boolean =>
  a.operations.length === 0 && a.balance.isZero();

class AccountScreen extends PureComponent<Props, State> {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: <AccountHeaderTitle navigation={navigation} />,
    headerRight: <AccountHeaderRight navigation={navigation} />,
  });

  state = {
    opCount: 100,
  };

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
    const { summary, account } = this.props;
    if (!account) return null;
    // TODO: we need to make a different GraphCard for Account screen:
    // - we can optimize more (e.g. only need to calculate the balance of this account, which is cached btw. no need for countervalues and the more complex algo)
    // - less if logic in graph (we shouldn't have magically guess if it's a "countervalue" mode or a "crypto" one)
    // - the fact we want later to diverge both a bit (graph differ already, and later if we intro the idea to switch between modes)
    return (
      <View>
        <Header accountId={account.id} />
        <GraphCard summary={summary} renderTitle={this.renderListHeaderTitle} />
      </View>
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

  renderSectionHeader = ({ section }) => <SectionHeader section={section} />;

  render() {
    const { account, navigation } = this.props;
    const { opCount } = this.state;

    if (!account) return null;

    if (isAccountEmpty(account)) {
      return <EmptyStateAccount account={account} navigation={navigation} />;
    }

    const { sections, completed } = groupAccountOperationsByDay(
      account,
      opCount,
    );

    return (
      <View style={styles.root}>
        <List
          ref={this.ref}
          sections={sections}
          style={styles.sectionList}
          contentContainerStyle={styles.contentContainer}
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
          renderSectionHeader={this.renderSectionHeader}
          onEndReached={this.onEndReached}
          showsVerticalScrollIndicator={false}
          accountId={account.id}
          stickySectionHeadersEnabled={false}
        />
      </View>
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
