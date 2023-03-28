import React, { useState, useCallback, useMemo } from "react";
import { FlatList, LayoutChangeEvent, ListRenderItemInfo } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { Flex } from "@ledgerhq/native-ui";
import debounce from "lodash/debounce";
import { useTranslation } from "react-i18next";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import { isAccountEmpty } from "@ledgerhq/live-common/account/helpers";
import { StackNavigationProp } from "@react-navigation/stack";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import { switchCountervalueFirst } from "../../actions/settings";
import { useBalanceHistoryWithCountervalue } from "../../hooks/portfolio";
import {
  selectedTimeRangeSelector,
  counterValueCurrencySelector,
  countervalueFirstSelector,
} from "../../reducers/settings";
import { accountScreenSelector } from "../../reducers/accounts";
import { track, TrackScreen } from "../../analytics";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import { ScreenName } from "../../const";
import CurrencyBackgroundGradient from "../../components/CurrencyBackgroundGradient";
import AccountHeader from "./AccountHeader";
import { getListHeaderComponents } from "./ListHeaderComponent";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import EmptyAccountCard from "./EmptyAccountCard";
import useAccountActions from "./hooks/useAccountActions";
import type { AccountsNavigatorParamList } from "../../components/RootNavigator/types/AccountsNavigator";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";

type Props =
  | StackNavigatorProps<AccountsNavigatorParamList, ScreenName.Account>
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.Account>;

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

function AccountScreen({ route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  if (!account) return null;
  return (
    <AccountScreenInner
      account={account}
      parentAccount={parentAccount || undefined}
    />
  );
}

const AccountScreenInner = ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount?: Account | undefined;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation =
    useNavigation<StackNavigationProp<AccountsNavigatorParamList>>();
  const dispatch = useDispatch();
  const range = useSelector(selectedTimeRangeSelector);
  const { countervalueAvailable, countervalueChange, cryptoChange, history } =
    useBalanceHistoryWithCountervalue({ account, range });
  const useCounterValue = useSelector(countervalueFirstSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const isEmpty = isAccountEmpty(account);

  const onSwitchAccountCurrency = useCallback(() => {
    dispatch(switchCountervalueFirst());
    track("button_clicked", {
      button: "Switch Account Currency",
      countervalue: useCounterValue,
    });
  }, [dispatch, useCounterValue]);

  const onAccountPress = debounce((tokenAccount?: TokenAccount) => {
    if (!tokenAccount) return;
    navigation.push(ScreenName.Account, {
      parentId: account.id,
      accountId: tokenAccount.id,
    });
  }, 300);

  const currency = getAccountCurrency(account);

  const analytics = (
    <TrackScreen
      category="Account"
      currency={currency.name}
      operationsSize={account.operations.length}
    />
  );

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(100);
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

  const onAccountCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

  const { secondaryActions } = useAccountActions({ account, parentAccount });

  const { listHeaderComponents } = useMemo(
    () =>
      getListHeaderComponents({
        account,
        parentAccount,
        countervalueAvailable: countervalueAvailable || account.balance.eq(0),
        useCounterValue,
        range,
        history,
        countervalueChange,
        cryptoChange,
        onAccountPress,
        counterValueCurrency,
        onSwitchAccountCurrency,
        onAccountCardLayout,
        colors,
        secondaryActions,
        t,
      }),
    [
      account,
      parentAccount,
      countervalueAvailable,
      useCounterValue,
      range,
      history,
      countervalueChange,
      cryptoChange,
      onAccountPress,
      counterValueCurrency,
      onSwitchAccountCurrency,
      onAccountCardLayout,
      colors,
      secondaryActions,
      t,
    ],
  );

  const data = [
    ...listHeaderComponents,
    ...(!isEmpty
      ? [
          <SectionContainer px={6} isLast>
            <SectionTitle title={t("analytics.operations.title")} />
            <OperationsHistorySection accounts={[account]} />
          </SectionContainer>,
        ]
      : [
          <Flex px={6}>
            <EmptyAccountCard currencyTicker={currency.ticker} />
          </Flex>,
        ]),
  ];

  return (
    <ReactNavigationPerformanceView screenName={ScreenName.Account} interactive>
      <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
        {analytics}
        <CurrencyBackgroundGradient
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          gradientColor={getCurrencyColor(currency) || colors.primary.c80}
        />
        <AnimatedFlatListWithRefreshControl
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_SAFE_HEIGHT + 48,
            marginTop: 92,
          }}
          data={data}
          renderItem={({ item }: ListRenderItemInfo<unknown>) =>
            item as JSX.Element
          }
          keyExtractor={(_: unknown, index: number) => String(index)}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
        />
        <AccountHeader
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          account={account}
          useCounterValue={useCounterValue}
          counterValueCurrency={counterValueCurrency}
          history={history}
          countervalueAvailable={countervalueAvailable}
          parentAccount={parentAccount}
        />
      </TabBarSafeAreaView>
    </ReactNavigationPerformanceView>
  );
};

export default React.memo(withDiscreetMode(AccountScreen));
