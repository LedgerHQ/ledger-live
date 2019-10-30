/* @flow */

import {
  flattenAccounts,
  getAccountCurrency,
  groupAccountsOperationsByDay,
  isAccountEmpty,
} from "@ledgerhq/live-common/lib/account";
import type {
  Account,
  Currency,
  Operation,
  PortfolioRange,
  Unit,
} from "@ledgerhq/live-common/lib/types";
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { compose } from "redux";
import { connect } from "react-redux";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import {
  // prettier-ignore
  // $FlowFixMe
  SectionList,
  SafeAreaView,
  withNavigation,
} from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import CurrencyIcon from "../../components/CurrencyIcon";
import colors from "../../colors";
import { switchCountervalueFirst } from "../../actions/settings";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import type { Item } from "../../components/Graph/types";
import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import AssetGraphCard from "../../components/AssetGraphCard";
import { currencyPortfolioSelector } from "../../actions/portfolio";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import LoadingFooter from "../../components/LoadingFooter";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";
import AccountDistribution from "../../components/AccountDistribution";
import OperationRow from "../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import type { State } from "../../reducers";
import { accountsSelector } from "../../reducers/accounts";
import {
  counterValueCurrencySelector,
  countervalueFirstSelector,
  selectedTimeRangeSelector,
} from "../../reducers/settings";

// $FlowFixMe
const List = globalSyncRefreshControl(SectionList);

type Props = {
  accounts: any, // Fixme doesn't want AccountLikeArray
  allAccounts: Account[],
  useCounterValue: boolean,
  counterValueUnit: Unit,
  switchCountervalueFirst: () => *,
  range: PortfolioRange,
  currency: Currency,
  portfolio: *,
  counterValueCurrency: Currency,
  navigation: NavigationScreenProp<*>,
};

class Asset extends PureComponent<Props, *> {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: (
      <View
        style={{
          flexDirection: "row",
        }}
      >
        <View style={{ marginRight: 5, justifyContent: "center" }}>
          <CurrencyIcon size={16} currency={navigation.state.params.currency} />
        </View>
        <LText semiBold secondary style={{ fontSize: 16 }}>
          {navigation.state.params.currency.name}
        </LText>
      </View>
    ),
    headerRight: null,
  });

  state = {
    opCount: 50,
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
    const { switchCountervalueFirst } = this.props;
    const countervalueAvailable = true;
    const items = [
      { unit: cryptoCurrencyUnit, value: item.value },
      countervalueAvailable && item.countervalue
        ? { unit: counterValueUnit, value: item.countervalue }
        : null,
    ];
    const shouldUseCounterValue = countervalueAvailable && useCounterValue;
    if (shouldUseCounterValue && item.countervalue) {
      items.reverse();
    }

    return (
      <Touchable
        event="SwitchAccountCurrency"
        eventProperties={{ useCounterValue: shouldUseCounterValue }}
        onPress={countervalueAvailable ? switchCountervalueFirst : undefined}
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

  renderHeader = () => {
    const {
      useCounterValue,
      range,
      currency,
      portfolio,
      counterValueCurrency,
      accounts,
    } = this.props;
    return (
      <View>
        <AssetGraphCard
          currency={currency}
          range={range}
          history={portfolio.history}
          useCounterValue={useCounterValue}
          valueChange={
            useCounterValue ? portfolio.valueChange : portfolio.cryptoChange
          }
          countervalueAvailable={portfolio.countervalueAvailable}
          counterValueCurrency={counterValueCurrency}
          renderTitle={this.renderListHeaderTitle}
        />
        <AccountDistribution
          accounts={accounts}
          counterValueCurrency={counterValueCurrency}
        />
      </View>
    );
  };

  renderSectionHeader = ({ section }: { section: * }) => (
    <SectionHeader section={section} />
  );

  renderItem = ({
    item,
    index,
    section,
  }: {
    item: Operation,
    index: number,
    section: SectionBase<*>,
  }) => {
    const { allAccounts, accounts, navigation } = this.props;
    const account = accounts.find(a => a.id === item.accountId);
    const parentAccount =
      account && account.type === "TokenAccount"
        ? allAccounts.find(a => a.id === account.parentId)
        : null;

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        parentAccount={parentAccount}
        account={account}
        navigation={navigation}
        multipleAccounts
        isLast={section.data.length - 1 === index}
      />
    );
  };

  onEndReached = () => {
    this.setState(prevState => ({ opCount: prevState.opCount + 50 }));
  };

  keyExtractor = (item: Operation) => item.id;
  ref = React.createRef();

  render() {
    const { opCount } = this.state;
    const { accounts, currency } = this.props;

    const { sections, completed } = groupAccountsOperationsByDay(accounts, {
      count: opCount,
      withSubAccounts: currency.type !== "CryptoCurrency", // Fixme, do sub accounts have 'tokens'?
    });

    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.root}>
          <List
            forwardedRef={this.ref}
            sections={sections}
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            keyExtractor={this.keyExtractor}
            renderItem={this.renderItem}
            renderSectionHeader={this.renderSectionHeader}
            onEndReached={this.onEndReached}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            ListHeaderComponent={this.renderHeader}
            ListFooterComponent={
              !completed ? (
                <LoadingFooter />
              ) : accounts.every(isAccountEmpty) ? null : sections.length ? (
                <NoMoreOperationFooter />
              ) : (
                <NoOperationFooter />
              )
            }
          />
        </SafeAreaView>
      </View>
    );
  }
}

const mapStateToProps = (state: State, props: *) => {
  const currency = props.navigation.state.params.currency;
  return {
    currency,
    range: selectedTimeRangeSelector(state),
    counterValue: counterValueCurrencySelector(state),
    accounts: flattenAccounts(accountsSelector(state))
      .filter(a => getAccountCurrency(a) === currency)
      .sort((a, b) => b.balance.comparedTo(a.balance)),
    allAccounts: accountsSelector(state),
    counterValueCurrency: counterValueCurrencySelector(state),
    useCounterValue: countervalueFirstSelector(state),
    portfolio: currencyPortfolioSelector(state, {
      currency,
      range: selectedTimeRangeSelector(state),
    }),
  };
};

const mapDispatchToProps = { switchCountervalueFirst };
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(withNavigation(Asset));

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flex: 1,
    flexGrow: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 64,
  },
  balanceTextContainer: {
    marginBottom: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceText: {
    fontSize: 22,
    color: colors.darkBlue,
  },
  balanceSubText: {
    fontSize: 16,
    color: colors.smoke,
  },
  balanceContainer: {
    marginLeft: 16,
    alignItems: "flex-end",
  },
});
