import { ABTestingVariants } from "@ledgerhq/types-live";
import React, { useState } from "react";
import Card from "~/renderer/components/Box/Card";
import { WidgetList } from "~/renderer/screens/dashboard/MarketPerformanceWidget/WidgetList";
import { Order, Props, PropsBody } from "./types";
import { Flex } from "@ledgerhq/react-ui";
import { MarketPerformanceWidgetFooter } from "./Footer";
import { MarketPerformanceWidgetHeader } from "./Header";

const BodyByMode: Record<ABTestingVariants, React.ComponentType<PropsBody>> = {
  [ABTestingVariants.variantA]: WidgetList,
  [ABTestingVariants.variantB]: WidgetList,
};

export function MarketPerformanceWidgetContainer({ variant, data }: Props) {
  const [order, setOrder] = useState<Order>(Order.asc);
  const Body = BodyByMode[variant];
  return (
    <Card px={6} py={5} grow>
      <MarketPerformanceWidgetHeader order={order} onChangeOrder={setOrder} />

      <Flex flex={1}>
        <Body data={data} order={order} />
      </Flex>
      <MarketPerformanceWidgetFooter />
    </Card>
  );
}
