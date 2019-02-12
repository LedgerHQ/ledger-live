// @flow

import React, { PureComponent } from "react";
import { compose } from "redux";
import { StyleSheet, View, Animated } from "react-native";
import { SectionList } from "react-navigation";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { createStructuredSelector } from "reselect";
import { translate } from "react-i18next";
import {
  isAccountEmpty,
  groupAccountOperationsByDay,
} from "@ledgerhq/live-common/lib/account";
import type { Account, Operation, Unit } from "@ledgerhq/live-common/lib/types";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import OperationRow from "../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import LText from "../../components/LText";
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
import AccountActions from "./AccountActions";
import AccountGraphCard from "../../components/AccountGraphCard";
import NoOperationFooter from "../../components/NoOperationFooter";

type Props = {
  account: Account,
  summary: Summary,
  navigation: { emit: (event: string) => void } & NavigationScreenProp<{
    accountId: string,
  }>,
};

type State = {
  opCount: number,
};

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);
const List = accountSyncRefreshControl(AnimatedSectionList);

class AccountScreen extends PureComponent<Props, State> {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: <AccountHeaderTitle navigation={navigation} />,
    headerRight: <AccountHeaderRight navigation={navigation} />,
  });

  state = {
    opCount: 100,
  };

  keyExtractor = (item: Operation) => item.id;

  renderItem = ({
    item,
    index,
    section,
  }: {
    item: Operation,
    index: number,
    section: SectionBase<*>,
  }) => {
    const { account, navigation } = this.props;
    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        account={account}
        navigation={navigation}
        isLast={section.data.length - 1 === index}
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
  }) => {
    const { summary } = this.props;
    return (
      <View style={styles.balanceContainer}>
        <LText style={styles.balanceText} tertiary>
          <CurrencyUnitValue
            unit={this.props.account.unit}
            value={item.originalValue}
          />
        </LText>
        {summary.isAvailable && (
          <LText style={styles.balanceSubText} tertiary>
            <CurrencyUnitValue unit={counterValueUnit} value={item.value} />
          </LText>
        )}
      </View>
    );
  };

  ListHeaderComponent = () => {
    const { summary, account } = this.props;
    if (!account) return null;
    const empty = isAccountEmpty(account);
    return (
      <View style={styles.header}>
        <Header accountId={account.id} />
        {!empty && (
          <AccountGraphCard
            summary={summary}
            renderTitle={this.renderListHeaderTitle}
          />
        )}
        {!empty && <AccountActions accountId={account.id} />}
      </View>
    );
  };

  ListEmptyComponent = () => {
    const { account, navigation } = this.props;
    return (
      isAccountEmpty(account) && (
        <EmptyStateAccount account={account} navigation={navigation} />
      )
    );
  };

  ref = React.createRef();

  onPress = () => {
    this.props.navigation.emit("refocus");
  };

  renderSectionHeader = ({ section }) => <SectionHeader section={section} />;

  render() {
    const { account } = this.props;
    const { opCount } = this.state;
    if (!account) return null;

    const analytics = (
      <TrackScreen
        category="Account"
        currency={account.currency.id}
        operationsSize={account.operations.length}
      />
    );

    const { sections, completed } = groupAccountOperationsByDay(
      account,
      opCount,
    );

    return (
      <View style={styles.root}>
        {analytics}
        <List
          ref={this.ref}
          sections={sections}
          style={styles.sectionList}
          contentContainerStyle={styles.contentContainer}
          ListFooterComponent={
            !completed ? (
              <LoadingFooter />
            ) : sections.length === 0 ? (
              isAccountEmpty(account) ? null : (
                <NoOperationFooter />
              )
            ) : (
              <NoMoreOperationFooter />
            )
          }
          ListHeaderComponent={this.ListHeaderComponent}
          ListEmptyComponent={this.ListEmptyComponent}
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
  translate(),
)(AccountScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "column",
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
    paddingBottom: 4,
    color: colors.darkBlue,
  },
  balanceSubText: {
    fontSize: 16,
    color: colors.smoke,
  },
  contentContainer: {
    paddingBottom: 64,
    flexGrow: 1,
  },
});
