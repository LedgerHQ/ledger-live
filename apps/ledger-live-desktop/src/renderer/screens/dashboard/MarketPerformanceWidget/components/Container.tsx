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

export function MarketPerformanceWidgetContainer({ variant, list, setOrder, order, state }: Props) {
  const Body = BodyByMode[variant];

  return (
    <Card px={6} py={5} grow>
      <MarketPerformanceWidgetHeader order={order} onChangeOrder={setOrder} />

      <Flex flex={1}>
        {state.isLoading ? (
          <Flex alignItems="center" justifyContent="center" flex={1}>
            <InfiniteLoader />
          </Flex>
        ) : state.hasError ? (
          <Error
            title={"dashboard.marketPerformanceWidget.error.title"}
            description={"dashboard.marketPerformanceWidget.error.description"}
          />
        ) : (
          <Body data={list} order={order} />
        )}
      </Flex>
      <MarketPerformanceWidgetFooter />
    </Card>
  );
}
