import React, { memo, useMemo, useState } from "react";
import { useTheme } from "styled-components/native";
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";
import { Flex, ScrollContainerHeader, Text } from "@ledgerhq/native-ui";
import { FlatList, Image, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import SafeAreaView from "~/components/SafeAreaView";
import { useLocale } from "~/context/Locale";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import { StyledIconContainer } from "../../components/MarketRowItem/MarketRowItem.styled";
import { counterValueFormatter, getDateFormatter } from "LLM/features/Market/utils";
import DeltaVariation from "../../components/DeltaVariation";
import MarketStats from "./components/MarketStats";
import AccountRow from "~/screens/Accounts/AccountRow";
import Button from "~/components/wrappedUi/Button";
import MarketGraph from "./components/MarketGraph";
import { ScreenName } from "~/const";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { FabMarketActions } from "~/components/FabActions/actionsList/market";
import { MarketQuickActions } from "~/components/MarketQuickActions";
import BackButton from "./components/BackButton";
import { Item } from "~/components/Graph/types";
import {
  CurrencyData,
  MarketCoinDataChart,
  KeysPriceChange,
  MarketCurrencyChartDataRequestParams,
} from "@ledgerhq/live-common/market/utils/types";
import usePullToRefresh from "../../hooks/usePullToRefresh";
import useMarketDetailViewModel from "./useMarketDetailViewModel";

interface ViewProps {
  loading: boolean;
  loadingChart: boolean;
  refresh: (param?: MarketCurrencyChartDataRequestParams) => void;
  defaultAccount?: AccountLike;
  toggleStar: () => void;
  isStarred: boolean;
  accounts: AccountLike[];
  counterCurrency?: string;
  allAccounts: AccountLike[];
  range: string;
  dataChart?: MarketCoinDataChart;
  currency?: CurrencyData;
}

function View({
  loading,
  loadingChart,
  refresh,
  defaultAccount,
  toggleStar,
  currency,
  dataChart,
  isStarred,
  accounts,
  counterCurrency,
  allAccounts,
  range,
}: ViewProps) {
  const { name, image, internalCurrency, price } = currency || {};

  const { handlePullToRefresh, refreshControlVisible } = usePullToRefresh({ loading, refresh });
  const [hoveredItem, setHoverItem] = useState<Item | null | undefined>(null);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale } = useLocale();

  const dateRangeFormatter = useMemo(
    () => getDateFormatter(locale, range as string),
    [locale, range],
  );

  const priceChangePercentage = currency?.priceChangePercentage[range as KeysPriceChange];

  return (
    <SafeAreaView edges={["top", "left", "right"]} isFlex>
      <ScrollContainerHeader
        TopLeftSection={<BackButton />}
        MiddleSection={
          <Flex height={48} flexDirection="row" justifyContent="flex-start" alignItems="center">
            {internalCurrency ? (
              <CircleCurrencyIcon
                size={32}
                currency={internalCurrency}
                color={undefined}
                sizeRatio={0.9}
              />
            ) : (
              image && (
                <StyledIconContainer>
                  <Image
                    source={{ uri: image }}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                </StyledIconContainer>
              )
            )}
            <Text ml={3} variant="large" fontSize={22}>
              {name}
            </Text>
          </Flex>
        }
        TopRightSection={
          <Button
            testID="star-asset"
            size="large"
            onPress={toggleStar}
            iconName={isStarred ? "StarSolid" : "Star"}
          />
        }
        BottomSection={
          <>
            <Flex justifyContent="center" alignItems="flex-start" pb={3}>
              <Text variant="h1" mb={1}>
                {counterValueFormatter({
                  currency: counterCurrency,
                  value: hoveredItem?.value ? hoveredItem.value : price || 0,
                  locale,
                  t,
                })}
              </Text>

              <Flex height={20}>
                {hoveredItem && hoveredItem.date ? (
                  <Text variant="body" color="neutral.c70">
                    {dateRangeFormatter.format(hoveredItem.date)}
                  </Text>
                ) : priceChangePercentage && !isNaN(priceChangePercentage) ? (
                  <DeltaVariation percent value={priceChangePercentage} />
                ) : (
                  <Text variant="body" color="neutral.c70">
                    {" "}
                    -
                  </Text>
                )}
              </Flex>
            </Flex>

            {internalCurrency ? (
              <FeatureToggle
                featureId="llmMarketQuickActions"
                fallback={
                  <Flex mb={6}>
                    <FabMarketActions
                      defaultAccount={defaultAccount}
                      currency={internalCurrency}
                      accounts={accounts}
                    />
                  </Flex>
                }
              />
            ) : null}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshControlVisible}
            colors={[colors.primary.c80]}
            tintColor={colors.primary.c80}
            onRefresh={handlePullToRefresh}
          />
        }
      >
        <MarketGraph
          setHoverItem={setHoverItem}
          isLoading={loadingChart}
          refreshChart={refresh}
          chartData={dataChart}
          range={range}
          currency={internalCurrency}
        />

        {internalCurrency && (
          <FeatureToggle featureId="llmMarketQuickActions">
            <MarketQuickActions currency={internalCurrency} accounts={accounts} />
          </FeatureToggle>
        )}

        {accounts?.length > 0 ? (
          <Flex mx={6} mt={8}>
            <Text variant="h3">{t("accounts.title")}</Text>
            <FlatList
              data={accounts}
              renderItem={({ item, index }: { item: AccountLike; index: number }) => (
                <AccountRow
                  navigationParams={[
                    ScreenName.Account,
                    {
                      parentId: (item as TokenAccount)?.parentId,
                      accountId: item.id,
                    },
                  ]}
                  account={item}
                  accountId={item.id}
                  isLast={index === allAccounts.length - 1}
                  hideDelta
                  sourceScreenName={ScreenName.MarketDetail}
                />
              )}
              keyExtractor={(item, index) => item.id + index}
            />
          </Flex>
        ) : null}

        <MarketStats
          currency={currency}
          counterCurrency={counterCurrency}
          priceChangePercentage={priceChangePercentage ?? 0}
        />
      </ScrollContainerHeader>
    </SafeAreaView>
  );
}

const ViewWithDiscreetMode = withDiscreetMode(View);

const MarketDetail = memo((props: Parameters<typeof useMarketDetailViewModel>[0]) => (
  <ViewWithDiscreetMode {...useMarketDetailViewModel(props)} />
));

export default MarketDetail;
