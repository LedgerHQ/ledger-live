import React, { memo, useMemo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { ensureContrast } from "../../colors";
import { ScreenName } from "../../const";
import { useDistribution } from "../../actions/general";
import RingChart from "../Analytics/RingChart";
import { track } from "../../analytics";

const NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY = 4;

const AllocationCaption = ({
  assetAllocation,
  colors,
}: {
  assetAllocation: any;
  colors: any;
}) => {
  if (!assetAllocation?.currency) return <></>;

  const currencyColor = ensureContrast(
    getCurrencyColor(assetAllocation.currency),
    colors.background.main,
  );

  return (
    <Flex flexDirection="row" alignItems="center" mb={3}>
      <Flex bg={currencyColor} width={8} height={8} borderRadius={4} mr={2} />
      <Text variant="body" fontWeight="semiBold">
        {assetAllocation.currency?.ticker}
      </Text>
    </Flex>
  );
};

const Allocations = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const distribution = useDistribution({ showEmptyAccounts: true });
  const { colors } = useTheme();

  const goToAnalyticsAllocations = useCallback(() => {
    track("analytics_clicked", {
      analytics: "Allocations",
    });
    navigation.navigate(ScreenName.AnalyticsAllocation);
  }, [navigation]);

  const distributionListFormatted = useMemo(() => {
    if (distribution.list.length <= NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY) {
      return distribution.list;
    }
    const data = distribution.list.slice(
      0,
      NUMBER_MAX_ALLOCATION_ASSETS_TO_DISPLAY - 1,
    );
    const othersAllocations = {
      currency: {
        id: "others",
        ticker: t("common.others"),
        color: colors.neutral.c70,
        type: "CryptoCurrency",
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
  }, [distribution.list, colors.neutral.c70, t]);

  return (
    <Flex flex={1} mt={6}>
      <TouchableOpacity onPress={goToAnalyticsAllocations}>
        <Flex flexDirection="row" alignItems="center">
          <Flex>
            <RingChart
              size={94}
              strokeWidth={5}
              data={distributionListFormatted}
              colors={colors}
            />
          </Flex>
          <Flex flex={1} ml={8} flexDirection="row" mt={3}>
            <Flex>
              {distributionListFormatted.length > 0 ? (
                <AllocationCaption
                  assetAllocation={distributionListFormatted[0]}
                  colors={colors}
                />
              ) : null}
              {distributionListFormatted.length > 1 ? (
                <AllocationCaption
                  assetAllocation={distributionListFormatted[1]}
                  colors={colors}
                />
              ) : null}
            </Flex>
            <Flex ml={8}>
              {distributionListFormatted.length > 2 ? (
                <AllocationCaption
                  assetAllocation={distributionListFormatted[2]}
                  colors={colors}
                />
              ) : null}
              {distributionListFormatted.length > 3 ? (
                <AllocationCaption
                  assetAllocation={distributionListFormatted[3]}
                  colors={colors}
                />
              ) : null}
            </Flex>
          </Flex>
          <Icons.DroprightMedium size={24} />
        </Flex>
      </TouchableOpacity>
    </Flex>
  );
};

export default memo(Allocations);
