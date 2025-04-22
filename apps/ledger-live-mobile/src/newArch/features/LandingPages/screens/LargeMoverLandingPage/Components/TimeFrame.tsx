import React from "react";
import { TabSelector } from "@ledgerhq/native-ui";
import { View } from "react-native";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import { useTranslation } from "react-i18next";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";

type TimeFrameProps = {
  range: KeysPriceChange;
  setRange: (range: KeysPriceChange) => void;
  width: number;
};

export const TimeFrame: React.FC<TimeFrameProps> = ({ range, setRange, width }) => {
  const { t } = useTranslation();
  const labels = Object.keys(rangeDataTable)
    .filter(key => key !== "1h")
    .map(key => ({
      id: key,
      value: t(`market.range.${rangeDataTable[key].label}`),
    }))
    .reverse();

  return (
    <View
      style={{
        height: 80,
        padding: 20,
        width: width,
      }}
    >
      <TabSelector
        initialTab={range}
        labels={labels}
        onToggle={id => setRange(id as KeysPriceChange)}
        filledVariant
      />
    </View>
  );
};
