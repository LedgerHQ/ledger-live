import React from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { HeaderProps, Order } from "./types";
import styled from "@ledgerhq/react-ui/components/styled";
import { track } from "~/renderer/analytics/segment";

const primary = "primary.c80";
const neutral = "neutral.c70";
export function MarketPerformanceWidgetHeader({ onChangeOrder, order }: HeaderProps) {
  const { t } = useTranslation();

  const onClickButton = (order: Order) => {
    onChangeOrder(order);
    track("button_clicked", {
      button: order === Order.asc ? "Gainers" : "Losers",
      page: "portfolio",
    });
  };

  return (
    <Flex justifyContent={"space-between"} mb={5} alignItems="center">
      <Text variant="large" fontWeight="semiBold">
        {t("dashboard.marketPerformanceWidget.title")}
      </Text>

      <Flex py={2} px={4} backgroundColor="opacityDefault.c05" borderRadius={32} ml={2}>
        <StyledText
          variant="small"
          fontWeight="semiBold"
          color={order === Order.asc ? primary : neutral}
          onClick={() => onClickButton(Order.asc)}
        >
          {t("dashboard.marketPerformanceWidget.gainers")}
        </StyledText>
        <StyledText
          variant="small"
          fontWeight="semiBold"
          color={order === Order.asc ? neutral : primary}
          ml={2}
          onClick={() => onClickButton(Order.desc)}
        >
          {t("dashboard.marketPerformanceWidget.losers")}
        </StyledText>
      </Flex>
    </Flex>
  );
}

const StyledText = styled(Text)`
  &:hover {
    cursor: pointer;
  }
`;
