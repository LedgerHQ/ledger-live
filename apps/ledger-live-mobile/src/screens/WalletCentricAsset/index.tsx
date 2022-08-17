import React, { useCallback, useMemo } from "react";
import { FlatList } from "react-native";
import Animated from "react-native-reanimated";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import accountSyncRefreshControl from "../../components/accountSyncRefreshControl";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { flattenAccountsByCryptoCurrencyScreenSelector } from "../../reducers/accounts";
import SectionContainer from "../WalletCentricSections/SectionContainer";
import SectionTitle from "../WalletCentricSections/SectionTitle";
import OperationsHistorySection from "../WalletCentricSections/OperationsHistory";
import MarketPriceSection from "../WalletCentricSections/MarketPrice";
import { FabAssetActions } from "../../components/FabActions";
import AccountsSection from "./AccountsSection";
import { NavigatorName } from "../../const";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useNavigation } from "@react-navigation/native";

type RouteParams = {
  currency: CryptoCurrency | TokenCurrency;
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
  const navigation = useNavigation();
  const { currency } = route.params;
  const cryptoAccounts = useSelector(
    flattenAccountsByCryptoCurrencyScreenSelector(currency),
  );

  const onAddAccount = useCallback(() => {
    if (currency && currency.type === "TokenCurrency") {
      navigation.navigate(NavigatorName.AddAccounts, {
        token: currency,
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        currency,
      });
    }
  }, [currency, navigation]);

  const data = useMemo(
    () => [
      <SectionContainer px={6}>
        <SectionTitle
          title={t("account.quickActions")}
          containerProps={{ mb: 6 }}
        ></SectionTitle>
        <FabAssetActions
          currency={currency}
          accounts={cryptoAccounts}
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
      <SectionContainer px={6}>
        <SectionTitle
          title={t("asset.accountsSection.title", {
            currencyName: currency.name,
          })}
          seeMoreText={t("addAccounts.sections.creatable.title")}
          onSeeAllPress={onAddAccount}
        />
        <AccountsSection accounts={cryptoAccounts}></AccountsSection>
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
