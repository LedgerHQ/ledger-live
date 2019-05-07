// @flow

import React, { PureComponent } from "react";
import { StyleSheet, View, Animated } from "react-native";
// $FlowFixMe
import { SectionList } from "react-navigation";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import {
  isAccountEmpty,
  groupAccountOperationsByDay,
} from "@ledgerhq/live-common/lib/account";
import type {
  Account,
  Currency,
  Operation,
  Unit,
  BalanceHistoryWithCountervalue,
  PortfolioRange,
} from "@ledgerhq/live-common/lib/types";
import { switchCountervalueFirst } from "../../actions/settings";
import { balanceHistoryWithCountervalueSelector } from "../../actions/portfolio";
import {
  selectedTimeRangeSelector,
  counterValueCurrencySelector,
  countervalueFirstSelector,
} from "../../reducers/settings";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import OperationRow from "../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import LText from "../../components/LText";
import LoadingFooter from "../../components/LoadingFooter";
import colors from "../../colors";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Header from "./Header";
import EmptyStateAccount from "./EmptyStateAccount";
import AccountHeaderRight from "./AccountHeaderRight";
import AccountHeaderTitle from "./AccountHeaderTitle";
import AccountActions from "./AccountActions";
import AccountGraphCard from "../../components/AccountGraphCard";
import NoOperationFooter from "../../components/NoOperationFooter";
import Touchable from "../../components/Touchable";
import type { Item } from "../../components/Graph/types";

type Props = {
  useCounterValue: boolean,
  switchCountervalueFirst: () => *,
  account: Account,
  range: PortfolioRange,
  history: BalanceHistoryWithCountervalue,
  counterValueCurrency: Currency,
  countervalueAvailable: boolean,
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

  onSwitchAccountCurrency = () => {
    this.props.switchCountervalueFirst();
  };

  renderListHeaderTitle = ({
    useCounterValue,
    cryptoCurrencyUnit,
    counterValueUnit,
    item,
  }: {
    useCounterValue: boolean,
    cryptoCurrencyUnit: Unit,
    counterValueUnit: Unit,
    item: Item,
  }) => {
    const { countervalueAvailable } = this.props;
    const items = [
      { unit: cryptoCurrencyUnit, value: item.value },
      item.countervalue
        ? { unit: counterValueUnit, value: item.countervalue }
        : null,
    ];
    if (useCounterValue && countervalueAvailable && item.countervalue) {
      items.reverse();
    }

    return (
      <Touchable
        event="SwitchAccountCurrency"
        eventProperties={{ useCounterValue }}
        onPress={this.onSwitchAccountCurrency}
      >
        <View style={styles.balanceContainer}>
          {items[0] ? (
            <LText style={styles.balanceText} tertiary>
              <CurrencyUnitValue {...items[0]} />
            </LText>
          ) : null}
          {items[1] ? (
            <LText style={styles.balanceSubText} tertiary>
              <CurrencyUnitValue {...items[1]} />
            </LText>
          ) : null}
        </View>
      </Touchable>
    );
  };

  ListHeaderComponent = () => {
    const {
      history,
      useCounterValue,
      counterValueCurrency,
      countervalueAvailable,
      range,
      account,
    } = this.props;
    if (!account) return null;
    const empty = isAccountEmpty(account);
    return (
      <View style={styles.header}>
        <Header accountId={account.id} />
        {!empty && (
          <AccountGraphCard
            account={account}
            range={range}
            unit={account.unit}
            history={history}
            useCounterValue={useCounterValue}
            countervalueAvailable={countervalueAvailable}
            counterValueCurrency={counterValueCurrency}
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

export default translate()(
  connect(
    (state, props) => {
      const account = accountScreenSelector(state, props);
      if (!account) return {};
      const range = selectedTimeRangeSelector(state);
      const counterValueCurrency = counterValueCurrencySelector(state);
      const useCounterValue = countervalueFirstSelector(state);
      const balanceHistoryWithCountervalue = balanceHistoryWithCountervalueSelector(
        state,
        { account },
      );
      return {
        ...balanceHistoryWithCountervalue,
        useCounterValue,
        counterValueCurrency,
        range,
        account,
      };
    },
    {
      switchCountervalueFirst,
    },
  )(AccountScreen),
);

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
