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
import React, { PureComponent, useMemo } from "react";
import { StyleSheet, View, SectionList } from "react-native";
import { useRoute, useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import SafeAreaView from "react-native-safe-area-view";
import CurrencyIcon from "../../components/CurrencyIcon";
import { switchCountervalueFirst } from "../../actions/settings";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import type { Item } from "../../components/Graph/types";
import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import AssetGraphCard from "../../components/AssetGraphCard";
import { useCurrencyPortfolio } from "../../actions/portfolio";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";
import LoadingFooter from "../../components/LoadingFooter";
import NoMoreOperationFooter from "../../components/NoMoreOperationFooter";
import NoOperationFooter from "../../components/NoOperationFooter";
import AccountDistribution from "../../components/AccountDistribution";
import OperationRow from "../../components/OperationRow";
import SectionHeader from "../../components/SectionHeader";
import { accountsSelector } from "../../reducers/accounts";
import {
  counterValueCurrencySelector,
  countervalueFirstSelector,
  selectedTimeRangeSelector,
} from "../../reducers/settings";

// $FlowFixMe
const List = globalSyncRefreshControl(SectionList);

type Props = {
  route: { params: any },
  counterValueUnit: Unit,
};

type AssetProps = Props & {
  currency: Currency,
  range: PortfolioRange,
  counterValue: any,
  accounts: any, // Fixme doesn't want AccountLikeArray
  allAccounts: Account[],
  counterValueCurrency: Currency,
  useCounterValue: boolean,
  portfolio: any,
  switchCountervalueFirst: () => void,
  colors: *,
};

export function HeaderTitle() {
  const route = useRoute();
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ marginRight: 5, justifyContent: "center" }}>
        <CurrencyIcon size={16} currency={route.params?.currency} />
      </View>
      <LText semiBold secondary style={{ fontSize: 16 }}>
        {route.params?.currency.name}
      </LText>
    </View>
  );
}

class Asset extends PureComponent<AssetProps, any> {
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
            <LText style={styles.balanceText} semiBold>
              <CurrencyUnitValue {...items[0]} joinFragmentsSeparator=" " />
            </LText>
          ) : null}
          {items[1] ? (
            <LText style={styles.balanceSubText} semiBold color="smoke">
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
    const { allAccounts, accounts } = this.props;
    const account = accounts.find(a => a.id === item.accountId);
    const parentAccount =
      account && account.type !== "Account"
        ? allAccounts.find(a => a.id === account.parentId)
        : null;

    if (!account) return null;

    return (
      <OperationRow
        operation={item}
        parentAccount={parentAccount}
        account={account}
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
    const { accounts, currency, colors } = this.props;

    const { sections, completed } = groupAccountsOperationsByDay(accounts, {
      count: opCount,
      withSubAccounts: currency.type !== "CryptoCurrency", // Fixme, do sub accounts have 'tokens'?
    });

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
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

export default function Screen(props: Props) {
  const dispatch = useDispatch();
  const currency = props.route.params.currency;
  const range = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const allAccounts = useSelector(accountsSelector);
  const accounts = useMemo(
    () =>
      flattenAccounts(allAccounts)
        .filter(a => getAccountCurrency(a) === currency)
        .sort((a, b) => b.balance.comparedTo(a.balance)),
    [allAccounts, currency],
  );
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const useCounterValue = useSelector(countervalueFirstSelector);
  const portfolio = useCurrencyPortfolio({
    currency,
    range,
  });

  const { colors } = useTheme();

  return (
    <Asset
      {...props}
      currency={currency}
      range={range}
      counterValue={counterValue}
      accounts={accounts}
      allAccounts={allAccounts}
      counterValueCurrency={counterValueCurrency}
      useCounterValue={useCounterValue}
      portfolio={portfolio}
      switchCountervalueFirst={(...args) =>
        dispatch(switchCountervalueFirst(...args))
      }
      colors={colors}
    />
  );
}

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
    lineHeight: 24,
  },
  balanceSubText: {
    fontSize: 16,
  },
  balanceContainer: {
    marginLeft: 16,
    alignItems: "flex-start",
  },
});
