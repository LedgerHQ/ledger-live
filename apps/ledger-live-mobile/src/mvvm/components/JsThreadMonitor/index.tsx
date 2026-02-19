import React from "react";
import { StyleSheet, View, Text } from "react-native";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import FloatingDebugButton from "~/components/FloatingDebugButton";
import { useJsThreadMonitor } from "./useJsThreadMonitor";

export function JsThreadMonitor() {
  if (!useEnv("JS_THREAD_MONITOR")) return null;
  return (
    <FloatingDebugButton onPress={noop} Icon={<BadgeContent />} boxWidth={44} boxHeight={36} />
  );
}

function noop() {}

const PLACEHOLDER = "-";

function BadgeContent() {
  const { stallPercentage, maxStall } = useJsThreadMonitor();

  const color = getSeverityColor(stallPercentage);
  const percentageText = stallPercentage === null ? PLACEHOLDER : `${stallPercentage.toFixed(1)}%`;
  const maxStallText = maxStall === null ? PLACEHOLDER : `${maxStall}ms`;

  return (
    <View style={styles.container}>
      <Text style={[styles.percentage, { color }]}>{percentageText}</Text>
      <Text style={styles.maxStall}>{maxStallText}</Text>
    </View>
  );
}

function getSeverityColor(stallPercentage: number | null): string {
  if (stallPercentage === null) return "#aaa"; // no data yet
  if (stallPercentage < 5) return "#2ecc40"; // green
  if (stallPercentage < 15) return "#ff851b"; // yellow/orange
  return "#ff4136"; // red
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  percentage: {
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  maxStall: {
    fontSize: 8,
    color: "#aaa",
    fontVariant: ["tabular-nums"],
  },
});
