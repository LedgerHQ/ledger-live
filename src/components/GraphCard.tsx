import React, { useCallback, useState, memo } from "react";
import { TouchableOpacity } from "react-native";
import { Currency } from "@ledgerhq/live-common/lib/types";
import { Portfolio } from "@ledgerhq/live-common/lib/portfolio/v2/types";
import { BoxedIcon, Flex, Text, GraphTabs } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { PieChartMedium } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import styled, { useTheme } from "styled-components/native";
import Delta from "./Delta";
import TransactionsPendingConfirmationWarning from "./TransactionsPendingConfirmationWarning";
import CurrencyUnitValue from "./CurrencyUnitValue";
import DiscreetModeButton from "./DiscreetModeButton";
import { NavigatorName } from "../const";

import { useTimeRange } from "../actions/settings";
import getWindowDimensions from "../logic/getWindowDimensions";
import Graph from "./Graph";
import FormatDate from "./FormatDate";

type Props = {
  areAccountsEmpty: boolean;
  portfolio: Portfolio;
  counterValueCurrency: Currency;
  useCounterValue?: boolean;
};

const Placeholder = styled(Flex).attrs({
  backgroundColor: "neutral.c40",
  borderRadius: "4px",
})``;
const BigPlaceholder = styled(Placeholder).attrs({
  width: 189,
  height: 18,
})``;

const SmallPlaceholder = styled(Placeholder).attrs({
  width: 109,
  height: 8,
  borderRadius: "2px",
})``;

function GraphCard({
  portfolio,
  counterValueCurrency,
  areAccountsEmpty,
}: Props) {
  const { t } = useTranslation();
  const { countervalueChange, balanceAvailable, balanceHistory } = portfolio;

  const item = balanceHistory[balanceHistory.length - 1];
  const navigation = useNavigation();

  const onPieChartButtonpress = useCallback(() => {
    navigation.navigate(NavigatorName.Analytics);
  }, [navigation]);

  const unit = counterValueCurrency.units[0];

  const [hoveredItem, setHoverItem] = useState();
  const [, setTimeRange, timeRangeItems] = useTimeRange();
  const { colors } = useTheme();

  const updateTimeRange = useCallback(
    index => {
      setTimeRange(timeRangeItems[index]);
    },
    [setTimeRange, timeRangeItems],
  );

  const mapGraphValue = useCallback(d => d.value || 0, []);

  const range = portfolio.range;
  const isAvailable = portfolio.balanceAvailable;

  const rangesLabels = timeRangeItems.map(({ label }) => label);

  const activeRangeIndex = timeRangeItems.findIndex(r => r.key === range);

  return (
    <Flex bg={"neutral.c30"} borderRadius={2}>
      <Flex
        flexDirection={"row"}
        justifyContent={"space-between"}
        alignItems={"flex-start"}
        p={6}
      >
        <Flex>
          <Flex flexDirection={"row"} alignItems={"center"} mb={1}>
            <Text
              variant={"small"}
              fontWeight={"semiBold"}
              color={"neutral.c70"}
              textTransform={"uppercase"}
              mr={2}
            >
              {t("tabs.portfolio")}
            </Text>
            {!areAccountsEmpty && <DiscreetModeButton size={20} />}
          </Flex>
          {areAccountsEmpty ? (
            <Text variant={"h3"} color={"neutral.c100"}>
              <CurrencyUnitValue unit={unit} value={0} />
            </Text>
          ) : (
            <>
              <Flex>
                {!balanceAvailable ? (
                  <BigPlaceholder mt="8px" />
                ) : (
                  <Text
                    fontFamily="Inter"
                    fontWeight="semiBold"
                    fontSize="30px"
                    color={"neutral.c100"}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    <CurrencyUnitValue
                      unit={unit}
                      value={hoveredItem ? hoveredItem.value : item.value}
                      joinFragmentsSeparator=" "
                    />
                  </Text>
                )}
                <TransactionsPendingConfirmationWarning />
              </Flex>
              <Flex flexDirection={"row"}>
                {!balanceAvailable ? (
                  <>
                    <SmallPlaceholder mt="12px" />
                  </>
                ) : (
                  <Flex flexDirection="row" alignItems="center">
                    {hoveredItem && hoveredItem.date ? (
                      <Text variant={"body"} fontWeight={"medium"}>
                        <FormatDate date={hoveredItem.date} />
                      </Text>
                    ) : (
                      <>
                        <Delta
                          percent
                          show0Delta
                          valueChange={countervalueChange}
                          // range={portfolio.range}
                        />
                        <Delta unit={unit} valueChange={countervalueChange} />
                      </>
                    )}
                  </Flex>
                )}
              </Flex>
            </>
          )}
        </Flex>
        {!areAccountsEmpty ? (
          <Flex>
            <TouchableOpacity onPress={onPieChartButtonpress}>
              <BoxedIcon
                Icon={PieChartMedium}
                variant={"circle"}
                iconSize={20}
                size={48}
                badgeSize={30}
                iconColor={"neutral.c100"}
              />
            </TouchableOpacity>
          </Flex>
        ) : null}
      </Flex>

      <Graph
        isInteractive={isAvailable}
        isLoading={!isAvailable}
        height={100}
        width={getWindowDimensions().width - 32}
        color={colors.primary.c80}
        data={balanceHistory}
        onItemHover={setHoverItem}
        mapValue={mapGraphValue}
      />
      <Flex mt={25} px={6} pb={6}>
        <GraphTabs
          activeIndex={activeRangeIndex}
          activeBg="background.main"
          onChange={updateTimeRange}
          labels={rangesLabels}
        />
      </Flex>
    </Flex>
  );
}

export default memo<Props>(GraphCard);
