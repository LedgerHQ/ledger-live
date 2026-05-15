import React from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { LineChart } from "@ledgerhq/lumen-ui-rnative-visualization";

const DEMO_DATA = [12, 19, 14, 25, 22, 30, 28, 35, 33, 40, 38, 45, 42, 50, 48, 55, 53, 60, 58, 65];

export default function DebugLumenVisualization() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Box lx={{ paddingHorizontal: "s24", paddingVertical: "s16", rowGap: "s24" }}>
        <Text typography="body2" lx={{ color: "muted" }}>
          Preview of @ledgerhq/lumen-ui-rnative-visualization components.
        </Text>

        <Box lx={{ rowGap: "s12" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            LineChart — area
          </Text>
          <LineChart
            series={[
              {
                id: "aggregated-assets-preview",
                data: DEMO_DATA,
                label: "Aggregated Assets",
                stroke: theme.colors.bg.accent,
              },
            ]}
            width={chartWidth}
            height={160}
            showArea
          />
        </Box>
      </Box>
    </ScrollView>
  );
}
