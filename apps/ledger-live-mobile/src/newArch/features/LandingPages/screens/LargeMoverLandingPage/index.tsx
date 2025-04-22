import { Flex } from "@ledgerhq/native-ui";
import React, { useState } from "react";
import { Card } from "./components/Card";
import { CurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";

export const mockCurrencyData: CurrencyData = {
  id: "ethereum",
  ledgerIds: ["ethereum"],
  name: "Ethereum",
  image: "https://example.com/ethereum.png",
  marketcap: 250000000000,
  marketcapRank: 2,
  totalVolume: 15000000000,
  high24h: 191200,
  low24h: 182800,
  ticker: "ETH",
  price: 188350,
  priceChangePercentage: {
    [KeysPriceChange.hour]: 0.3,
    [KeysPriceChange.day]: 1.5,
    [KeysPriceChange.week]: 4.2,
    [KeysPriceChange.month]: 10.1,
    [KeysPriceChange.year]: 25.0,
  },
  marketCapChangePercentage24h: 1.2,
  circulatingSupply: 120000000,
  totalSupply: 120000000,
  maxSupply: 120000000,
  ath: 480978,
  athDate: new Date("2021-11-10T00:00:00Z"),
  atl: 0.42,
  atlDate: new Date("2015-10-20T00:00:00Z"),
  sparklineIn7d: {
    path: "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80",
    viewBox: "0 0 200 100",
    isPositive: true,
  },
  chartData: {
    "24h": [
      [1681017600000, 60000],
      [1681104000000, 60500],
      [1681190400000, 59000],
      [1681276800000, 62000],
      [1681363200000, 61000],
    ],
    "7d": [
      [1680528000000, 59000],
      [1680614400000, 60000],
      [1680700800000, 61000],
      [1680787200000, 62000],
      [1680873600000, 62500],
      [1680960000000, 61500],
      [1681046400000, 63000],
    ],
    "1m": [
      [1678838400000, 1800],
      [1678924800000, 1850],
      [1679011200000, 1900],
      [1679097600000, 1950],
      [1679184000000, 2000],
      [1679270400000, 2050],
      [1679356800000, 2100],
      [1679443200000, 2150],
      [1679529600000, 2200],
      [1679616000000, 2250],
    ],
    "1y": [
      [1640995200000, 1000],
      [1643587200000, 1200],
      [1646179200000, 1400],
      [1648771200000, 1600],
      [1651363200000, 1800],
      [1653955200000, 2000],
      [1656547200000, 2200],
      [1659139200000, 2400],
      [1661731200000, 2600],
      [1664323200000, 2800],
      [1666915200000, 3000],
      [1669507200000, 3200],
      [1672099200000, 3400],
    ],
  },
};

export const LargeMoverLandingPage = () => {
  const [range, setRange] = useState<KeysPriceChange>(KeysPriceChange.day);
  return (
    <Flex marginTop={50} marginBottom={30}>
      <Card {...mockCurrencyData} range={range} setRange={setRange} />
    </Flex>
  );
};
