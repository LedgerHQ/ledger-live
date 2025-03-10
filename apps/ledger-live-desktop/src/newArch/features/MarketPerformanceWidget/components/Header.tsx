import React, { useRef } from "react";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { HeaderProps, Order } from "../types";
import styled from "@ledgerhq/react-ui/components/styled";
import { track } from "~/renderer/analytics/segment";
import { useResize } from "~/renderer/hooks/useResize";
import { useSelector } from "react-redux";
import { selectedTimeRangeSelector } from "~/renderer/reducers/settings";
import { useTheme } from "styled-components";

const RESPONSIVE_WIDTH = 330;

export function MarketPerformanceWidgetHeader({ onChangeOrder, order }: HeaderProps) {
  const { t } = useTranslation();
  const timeRange = useSelector(selectedTimeRangeSelector);
  const { colors } = useTheme();
  const primary = colors.primary.c80;
  const neutral = colors.neutral.c70;

  const onClickButton = (order: Order) => {
    onChangeOrder(order);
    track("button_clicked", {
      button: order === Order.asc ? "Gainers" : "Losers",
      page: "portfolio",
    });
  };

  const ref = useRef<HTMLDivElement>(null);
  const { width } = useResize(ref);

  return (
    <Flex justifyContent="space-between" alignItems="center" ref={ref} mb={3}>
      <Text variant="h3Inter" fontWeight="semiBold">
        {t("dashboard.marketPerformanceWidget.title", {
          time: t(`time.range.${timeRange}`),
        })}
      </Text>

      <Flex py={2} px={3} backgroundColor="opacityDefault.c05" borderRadius={32}>
        <Element
          data-testId="market-best-performers"
          alignItems="center"
          onClick={() => onClickButton(Order.asc)}
        >
          <Icons.ArrowUpRight
            size={width <= RESPONSIVE_WIDTH ? "M" : "S"}
            color={order === Order.asc ? primary : neutral}
          />

          <ResponsiveText
            width={width}
            color={order === Order.asc ? primary : neutral}
            text="dashboard.marketPerformanceWidget.gainers"
          />
        </Element>

        <Element
          data-testId="market-worst-performers"
          alignItems="center"
          ml={3}
          onClick={() => onClickButton(Order.desc)}
        >
          <Icons.ArrowDownRight
            size={width <= RESPONSIVE_WIDTH ? "M" : "S"}
            color={order === Order.asc ? neutral : primary}
          />

          <ResponsiveText
            width={width}
            color={order === Order.asc ? neutral : primary}
            text="dashboard.marketPerformanceWidget.losers"
          />
        </Element>
      </Flex>
    </Flex>
  );
}

function ResponsiveText({ color, text, width }: { color: string; text: string; width: number }) {
  const { t } = useTranslation();

  if (width <= RESPONSIVE_WIDTH) return null;
  return (
    <Text ml={2} variant="small" fontWeight="semiBold" color={color}>
      {t(text)}
    </Text>
  );
}

const Element = styled(Flex)`
  &:hover {
    cursor: pointer;
  }
`;
