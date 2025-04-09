import React from "react";
import { TabSelector } from "@ledgerhq/native-ui";
import { View } from "react-native";

export const TimeFrame = () => {
  return (
    <View
      style={{
        height: 80,
        padding: 20,
        width: 400,
      }}
    >
      <TabSelector
        initialTab="24h"
        labels={[
          {
            id: "24h",
            value: "1D",
          },
          {
            id: "7d",
            value: "1W",
          },
          {
            id: "1m",
            value: "1M",
          },
          {
            id: "1y",
            value: "1Y",
          },
        ]}
        onToggle={() => {}}
        filledVariant={true}
      />
    </View>
  );
};
