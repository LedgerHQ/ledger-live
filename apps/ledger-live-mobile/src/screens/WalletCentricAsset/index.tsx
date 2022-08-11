import React, { useMemo } from "react";
import { FlatList } from "react-native";
import Animated from "react-native-reanimated";
import { useSelector } from "react-redux";
import { getAccountCurrency } from "@ledgerhq/live-common/src/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/src/currencies";
import { useTranslation } from "react-i18next";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { accountsSelector } from "../../reducers/accounts";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import MarketPriceSection from "../WalletCentricSections/MarketPrice";
import { FabAssetActions } from "../../components/FabActions";

type RouteParams = {
  currencyId: string;
};

type Props = {
  navigation: any;
  route: { params: RouteParams };
};

const AnimatedFlatListWithRefreshControl = Animated.createAnimatedComponent(
  accountSyncRefreshControl(FlatList),
);

const AssetScreen = ({ route }: Props) => {
  const { t } = useTranslation();
  const accounts = useSelector(accountsSelector);
  const { currencyId } = route?.params;
  const currency = getCryptoCurrencyById(currencyId);
  const cryptoAccounts = useMemo(
    () => accounts.filter(a => getAccountCurrency(a).id === currencyId),
    [accounts, currencyId],
  );

  const data = useMemo(
    () => [
      <SectionContainer px={6}>
        <SectionTitle
          title={t("account.quickActions")}
          containerProps={{ mb: 6 }}
        ></SectionTitle>
        <FabAssetActions
          currency={currency}
          accounts={accounts}
        ></FabAssetActions>
      </SectionContainer>,
      <SectionContainer px={6}>
        <SectionTitle
          title={t("portfolio.marketPriceSection.title", {
            currencyTicker: currency.ticker,
          })}
        />
        <MarketPriceSection currency={currency} />
      </SectionContainer>,
      <SectionContainer px={6} isLast>
        <SectionTitle title={t("analytics.operations.title")} />
        <OperationsHistorySection accounts={cryptoAccounts} />
      </SectionContainer>,
    ],
    [cryptoAccounts, currency, t],
  );

  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      <AnimatedFlatListWithRefreshControl
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        data={data}
        renderItem={({ item }: any) => item}
        keyExtractor={(_: any, index: any) => String(index)}
        showsVerticalScrollIndicator={false}
      />
    </TabBarSafeAreaView>
  );
};

export default withDiscreetMode(AssetScreen);
