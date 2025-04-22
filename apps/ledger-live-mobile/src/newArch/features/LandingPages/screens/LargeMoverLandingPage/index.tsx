import { Flex } from "@ledgerhq/native-ui";
import React, { useState } from "react";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { mockCurrencyData } from "./fixtures/currency";
import Card from "./components/Card";

export const LargeMoverLandingPage = () => {
  const [range, setRange] = useState<KeysPriceChange>(KeysPriceChange.day);
  return (
    <Flex marginTop={50} marginBottom={30}>
      <Card {...mockCurrencyData} range={range} setRange={setRange} />
    </Flex>
  );
};
