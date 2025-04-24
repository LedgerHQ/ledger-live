import React from "react";
import { TabSelector } from "@ledgerhq/native-ui";
import { Dimensions, View } from "react-native";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import { useTranslation } from "react-i18next";

export const TimeFrame = () => {
  const { t } = useTranslation();
  const labels = Object.keys(rangeDataTable)
    .filter(key => key !== "1h")
    .map(key => ({
      id: key,
      value: t(`market.range.${rangeDataTable[key].label}`),
    }))
    .reverse();

  const screenWidth = Dimensions.get("window").width;

  return (
    <View
      style={{
        height: 80,
        padding: 20,
        width: screenWidth * 0.9,
      }}
    >
      <TabSelector initialTab="24h" labels={labels} onToggle={() => {}} filledVariant />
    </View>
  );
};
