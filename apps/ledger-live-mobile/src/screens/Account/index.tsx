import React, { useState, useCallback, useMemo } from "react";
import { FlatList } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  Account,
  AccountLike,
  TokenAccount,
  Operation,
} from "@ledgerhq/types-live";
import debounce from "lodash/debounce";
import {
  getAccountCapabilities,
  makeCompoundSummaryForAccount,
} from "@ledgerhq/live-common/compound/logic";
import { useTranslation } from "react-i18next";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTheme } from "styled-components/native";
import { switchCountervalueFirst } from "../../actions/settings";
import { useBalanceHistoryWithCountervalue } from "../../actions/portfolio";
import {
  selectedTimeRangeSelector,
  counterValueCurrencySelector,
  countervalueFirstSelector,
} from "../../reducers/settings";
import { accountScreenSelector } from "../../reducers/accounts";
import { TrackScreen } from "../../analytics";
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

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  accountId: string;
  parentId?: string;
};

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

function AccountScreen({ route }: Props) {
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  if (!account) return null;
  return <AccountScreenInner account={account} parentAccount={parentAccount} />;
}

const AccountScreenInner = ({
  account,
  parentAccount,
}: {
  account: AccountLike;
  parentAccount: Account | undefined;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const range = useSelector(selectedTimeRangeSelector);
  const {
    countervalueAvailable,
    countervalueChange,
    cryptoChange,
    history,
  } = useBalanceHistoryWithCountervalue({ account, range });
  const useCounterValue = useSelector(countervalueFirstSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);

  const onSwitchAccountCurrency = useCallback(() => {
    dispatch(switchCountervalueFirst());
  }, [dispatch]);

  const onAccountPress = debounce((tokenAccount: TokenAccount) => {
    navigation.push(ScreenName.Account, {
      parentId: account.id,
      accountId: tokenAccount.id,
    });
  }, 300);

  const currency = getAccountCurrency(account);

  const analytics = (
    <TrackScreen
      category="Account"
      currency={currency.id}
      operationsSize={account.operations.length}
    />
  );

  const compoundCapabilities: any =
    account.type === "TokenAccount" &&
    !!account.compoundBalance &&
    getAccountCapabilities(account);

  const compoundSummary =
    compoundCapabilities?.status && account.type === "TokenAccount"
      ? makeCompoundSummaryForAccount(account, parentAccount)
      : undefined;

  const [isCollapsed, setIsCollapsed] = useState(true);

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

  const onAccountCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 10);
  }, []);

  const { listHeaderComponents } = useMemo(
    () =>
      getListHeaderComponents({
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
        compoundSummary,
        isCollapsed,
        setIsCollapsed,
        onAccountCardLayout,
      }),
    [
      account,
      onAccountPress,
      compoundSummary,
      counterValueCurrency,
      countervalueAvailable,
      countervalueChange,
      cryptoChange,
      history,
      isCollapsed,
      onAccountCardLayout,
      onSwitchAccountCurrency,
      parentAccount,
      range,
      useCounterValue,
    ],
  );

  const data = [
    ...listHeaderComponents,
    <SectionContainer px={6} isLast>
      <SectionTitle title={t("analytics.operations.title")} />
      <OperationsHistorySection accounts={[account, parentAccount]} />
    </SectionContainer>,
  ];

  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      {analytics}
      <CurrencyBackgroundGradient
        currentPositionY={currentPositionY}
        graphCardEndPosition={graphCardEndPosition}
        gradientColor={getCurrencyColor(currency) || colors.primary.c80}
      />
      <AnimatedFlatListWithRefreshControl
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        data={data}
        renderItem={({ item }: any) => item}
        keyExtractor={(_: any, index: any) => String(index)}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
      />
      <AccountHeader
        currentPositionY={currentPositionY}
        graphCardEndPosition={graphCardEndPosition}
        account={account}
      />
    </TabBarSafeAreaView>
  );
};

export default withDiscreetMode(AccountScreen);
