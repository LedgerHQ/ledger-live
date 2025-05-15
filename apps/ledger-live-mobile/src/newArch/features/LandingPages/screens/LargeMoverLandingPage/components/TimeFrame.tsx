import React from "react";
import { TabSelector } from "@ledgerhq/native-ui";
import { View } from "react-native";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import { useTranslation } from "react-i18next";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { track } from "~/analytics";
import { PAGE_NAME } from "../const";

type TimeFrameProps = {
  range: KeysPriceChange;
  setRange: (range: KeysPriceChange) => void;
  width: number;
  coin: string;
};

export const TimeFrame: React.FC<TimeFrameProps> = ({ range, setRange, width, coin }) => {
  const { t } = useTranslation();
  const labels: { id: KeysPriceChange; value: string }[] = Object.keys(rangeDataTable)
    .filter(key => key !== "1h")
    .map(key => ({
      id: key as KeysPriceChange,
      value: t(`market.range.${rangeDataTable[key].label}`),
    }))
    .reverse();

  const handleTabSelection = (id: KeysPriceChange) => {
    track("button_clicked", {
      button: "timeframe",
      timeframe: id,
      page: PAGE_NAME,
      coin: coin,
    });
    setRange(id);
  };

  return (
    <View
      style={{
        height: 80,
        padding: 20,
        width: width,
      }}
    >
      <TabSelector initialTab={range} labels={labels} onToggle={handleTabSelection} filledVariant />
    </View>
  );
};
