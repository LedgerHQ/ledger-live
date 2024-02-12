import React, { memo, useMemo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { getCurrencyColor, ColorableCurrency } from "@ledgerhq/live-common/currencies/index";
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { DefaultTheme, useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { chunk } from "lodash";
import { ensureContrast } from "../../colors";
import { ScreenName } from "~/const";
import { useDistribution } from "~/actions/general";
import RingChart, { ColorableDistributionItem } from "../Analytics/RingChart";
import { track } from "~/analytics";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";

const NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY = 4;

const getCurrencyColorEnsureContrast = (
  currency: ColorableCurrency,
  colors: DefaultTheme["colors"],
) => ensureContrast(getCurrencyColor(currency), colors.background.main);

const AllocationCaption = React.memo(
  ({ currencyTicker, currencyColor }: { currencyTicker: string; currencyColor: string }) => {
    return (
      <Flex flexDirection="row" alignItems="center" mb={3}>
        <Flex bg={currencyColor} width={8} height={8} borderRadius={4} mr={2} />
        <Text variant="body" fontWeight="semiBold">
          {currencyTicker}
        </Text>
      </Flex>
    );
  },
);

const Allocations = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount: true,
  });
  const { colors } = useTheme();
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  const goToAnalyticsAllocations = useCallback(() => {
    track("analytics_clicked", {
      analytics: "Allocations",
    });
    navigation.navigate(ScreenName.AnalyticsAllocation);
  }, [navigation]);

  const distributionListFormatted: ColorableDistributionItem[] = useMemo(() => {
    const displayedCurrencies: ColorableDistributionItem[] = distribution.list
      .filter(asset => {
        return (
          asset.currency.type !== "TokenCurrency" ||
          !blacklistedTokenIds.includes(asset.currency.id)
        );
      })
      .map(obj => {
        const { accounts, ...other } = obj;
        return other;
      });

    // if there are no blacklisted tokens and there is less than NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY
    // then we display the whole list
    if (
      displayedCurrencies.length === distribution.list.length &&
      displayedCurrencies.length <= NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY
    ) {
      return distribution.list;
    }

    const data: ColorableDistributionItem[] = displayedCurrencies.slice(
      0,
      NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY - 1,
    );

    const othersAllocations: ColorableDistributionItem = {
      currency: {
        type: "CryptoCurrency",
        id: "others",
        ticker: t("common.others"),
        color: colors.neutral.c70,
      },
      distribution: 0,
      amount: 0,
    };

    for (const assetAllocation of distribution.list.slice(
      NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY - 1,
    )) {
      othersAllocations.distribution += assetAllocation.distribution;
      othersAllocations.amount += assetAllocation.amount;
    }

    data.push(othersAllocations);

    return data;
  }, [distribution.list, colors.neutral.c70, t, blacklistedTokenIds]);

  const allocations = useMemo(
    () =>
      chunk(distributionListFormatted.slice(0, 4), 2).map((column, columnIndex) => (
        <Flex key={columnIndex} ml={columnIndex === 0 ? 0 : 8}>
          {column.map(distributionItem => (
            <AllocationCaption
              key={distributionItem.currency.id}
              currencyTicker={distributionItem.currency.ticker}
              currencyColor={getCurrencyColorEnsureContrast(distributionItem.currency, colors)}
            />
          ))}
        </Flex>
      )),
    [distributionListFormatted, colors],
  );

  return (
    <Flex flex={1} mt={6}>
      <TouchableOpacity onPress={goToAnalyticsAllocations}>
        <Flex flexDirection="row" alignItems="center">
          <Flex>
            <RingChart size={94} strokeWidth={5} data={distributionListFormatted} colors={colors} />
          </Flex>
          <Flex flex={1} ml={8} flexDirection="row" mt={3}>
            {allocations}
          </Flex>
          <IconsLegacy.ChevronRightMedium size={24} />
        </Flex>
      </TouchableOpacity>
    </Flex>
  );
};

export default memo(Allocations);
