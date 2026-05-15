import React, { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import {
  Box,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { LineChart, type Series } from "@ledgerhq/lumen-ui-rnative-visualization";

type DataPattern = "rising" | "volatile" | "sine" | "flat";
type StrokeKey = "accent" | "successStrong" | "errorStrong" | "warningStrong";

const POINT_COUNTS = [5, 10, 20, 50] as const;
const HEIGHTS = [120, 160, 240] as const;

function generateData(pattern: DataPattern, count: number): number[] {
  const span = Math.max(count - 1, 1);
  switch (pattern) {
    case "rising":
      return Array.from({ length: count }, (_, i) => 10 + (i * 50) / span);
    case "volatile":
      return Array.from(
        { length: count },
        (_, i) => 30 + Math.sin(i * 0.7) * 15 + Math.cos(i * 1.3) * 10 + Math.random() * 8,
      );
    case "sine":
      return Array.from({ length: count }, (_, i) => 30 + Math.sin(i * (Math.PI / 6)) * 20);
    case "flat":
      return Array.from({ length: count }, () => 30);
  }
}

export default function DebugLumenVisualization() {
  const { theme } = useTheme();

  const [pattern, setPattern] = useState<DataPattern>("rising");
  const [pointCount, setPointCount] = useState<number>(20);
  const [strokeKey, setStrokeKey] = useState<StrokeKey>("accent");
  const [height, setHeight] = useState<number>(160);
  const [showArea, setShowArea] = useState(true);
  const [showXAxis, setShowXAxis] = useState(false);
  const [showYAxis, setShowYAxis] = useState(false);
  const [multiSeries, setMultiSeries] = useState(false);

  const primaryData = useMemo(() => generateData(pattern, pointCount), [pattern, pointCount]);
  const secondaryData = useMemo(
    () => (multiSeries ? generateData("sine", pointCount) : null),
    [multiSeries, pointCount],
  );

  const series = useMemo<Series[]>(() => {
    const items: Series[] = [
      {
        id: "primary",
        data: primaryData,
        label: "Primary",
        stroke: theme.colors.bg[strokeKey],
      },
    ];
    if (secondaryData) {
      items.push({
        id: "secondary",
        data: secondaryData,
        label: "Secondary",
        stroke: theme.colors.bg.mutedStrong,
      });
    }
    return items;
  }, [primaryData, secondaryData, strokeKey, theme.colors.bg]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Box lx={{ paddingHorizontal: "s24", paddingVertical: "s16", rowGap: "s24" }}>
        <Text typography="body2" lx={{ color: "muted" }}>
          Preview of @ledgerhq/lumen-ui-rnative-visualization. Tweak the controls below to inspect
          different chart configurations.
        </Text>

        <Box lx={{ rowGap: "s12" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            LineChart
          </Text>
          <LineChart
            series={series}
            height={height}
            showArea={showArea}
            showXAxis={showXAxis}
            showYAxis={showYAxis}
          />
        </Box>

        <Divider />

        <Box lx={{ rowGap: "s8" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            DATA PATTERN
          </Text>
          <SegmentedControl
            selectedValue={pattern}
            onSelectedChange={value => setPattern(value as DataPattern)}
          >
            <SegmentedControlButton value="rising">Rising</SegmentedControlButton>
            <SegmentedControlButton value="volatile">Volatile</SegmentedControlButton>
            <SegmentedControlButton value="sine">Sine</SegmentedControlButton>
            <SegmentedControlButton value="flat">Flat</SegmentedControlButton>
          </SegmentedControl>
        </Box>

        <Box lx={{ rowGap: "s8" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            POINT COUNT
          </Text>
          <SegmentedControl
            selectedValue={String(pointCount)}
            onSelectedChange={value => setPointCount(Number(value))}
          >
            {POINT_COUNTS.map(n => (
              <SegmentedControlButton key={n} value={String(n)}>
                {String(n)}
              </SegmentedControlButton>
            ))}
          </SegmentedControl>
        </Box>

        <Box lx={{ rowGap: "s8" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            STROKE COLOR
          </Text>
          <SegmentedControl
            selectedValue={strokeKey}
            onSelectedChange={value => setStrokeKey(value as StrokeKey)}
          >
            <SegmentedControlButton value="accent">Accent</SegmentedControlButton>
            <SegmentedControlButton value="successStrong">Success</SegmentedControlButton>
            <SegmentedControlButton value="errorStrong">Error</SegmentedControlButton>
            <SegmentedControlButton value="warningStrong">Warning</SegmentedControlButton>
          </SegmentedControl>
        </Box>

        <Box lx={{ rowGap: "s8" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            HEIGHT
          </Text>
          <SegmentedControl
            selectedValue={String(height)}
            onSelectedChange={value => setHeight(Number(value))}
          >
            {HEIGHTS.map(h => (
              <SegmentedControlButton key={h} value={String(h)}>
                {String(h)}
              </SegmentedControlButton>
            ))}
          </SegmentedControl>
        </Box>

        <Divider />

        <Box lx={{ rowGap: "s4" }}>
          <Text typography="body2SemiBold" lx={{ color: "muted" }}>
            TOGGLES
          </Text>
          <ToggleRow label="Show area fill" value={showArea} onChange={setShowArea} />
          <ToggleRow label="Show X axis" value={showXAxis} onChange={setShowXAxis} />
          <ToggleRow label="Show Y axis" value={showYAxis} onChange={setShowYAxis} />
          <ToggleRow
            label="Add a second series (sine)"
            value={multiSeries}
            onChange={setMultiSeries}
          />
        </Box>
      </Box>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: "s8",
      }}
    >
      <Text typography="body2" lx={{ color: "base" }}>
        {label}
      </Text>
      <Switch checked={value} onCheckedChange={onChange} />
    </Box>
  );
}
