import React from "react";
import { ABTestingVariants } from "@ledgerhq/types-live";
import Card from "~/renderer/components/Box/Card";
import { WidgetList } from "~/renderer/screens/dashboard/MarketPerformanceWidget/components/WidgetList";
import { Props, PropsBody } from "../types";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { MarketPerformanceWidgetFooter } from "./Footer";
import { MarketPerformanceWidgetHeader } from "./Header";
import { Error } from "./Error";

const BodyByMode: Record<ABTestingVariants, React.ComponentType<PropsBody>> = {
  [ABTestingVariants.variantA]: WidgetList,
  [ABTestingVariants.variantB]: WidgetList,
};

export function MarketPerformanceWidgetContainer({
  variant,
  list,
  setOrder,
  order,
  range,
  isLoading,
  hasError,
  top,
}: Props) {
  const Body = BodyByMode[variant];

  return (
    <Card
      px={{
        _: 4,
        lg: 4,
        xl: 5,
        xxl: 6,
      }}
      py={"23px"}
      grow
      data-test-id="market-performance-widget"
    >
      <MarketPerformanceWidgetHeader order={order} onChangeOrder={setOrder} />

      <Flex flex={1} alignItems="center" justifyContent="center">
        {isLoading ? (
          <InfiniteLoader />
        ) : hasError ? (
          <Error
            title={"dashboard.marketPerformanceWidget.error.title"}
            description={"dashboard.marketPerformanceWidget.error.description"}
            top={top}
            range={range}
          />
        ) : (
          <Body data={list} order={order} range={range} top={top} />
        )}
      </Flex>

      <MarketPerformanceWidgetFooter />
    </Card>
  );
}
