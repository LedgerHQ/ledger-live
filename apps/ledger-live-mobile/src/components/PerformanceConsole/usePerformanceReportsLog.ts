import { useState, useCallback, useEffect } from "react";
import { ReplaySubject } from "rxjs";
import { RenderPassReport } from "@shopify/react-native-performance";
import { Theme } from "@ledgerhq/native-ui/styles/theme";

export type PerformanceEventRenderable = {
  report: RenderPassReport;
  date: Date;
};

export const performanceReportSubject =
  new ReplaySubject<PerformanceEventRenderable>(30);

// Values based on "Creating React Native Vitals" https://www.coinbase.com/blog/performance-vitals-a-unified-scoring-system-to-guide-performance-health-and-prioritization
const navigationVitalsPoorThreshold = 600;
const navigationVitalsWarningThreshold = 400;

export function getNavigationVitalsStatusStyle(
  report: RenderPassReport | undefined,
  colors: Theme["colors"],
) {
  if (!report?.timeToRenderMillis) {
    return {
      bgColor: colors.neutral.c100,
      textColor: colors.neutral.c00,
    };
  }

  const { timeToRenderMillis } = report;

  const { bgColor, statusText } =
    timeToRenderMillis > navigationVitalsPoorThreshold
      ? { bgColor: colors.error.c100, statusText: "Poor" }
      : timeToRenderMillis > navigationVitalsWarningThreshold
      ? { bgColor: colors.warning.c100, statusText: "Needs improvement" }
      : { bgColor: colors.success.c100, statusText: "Good" };
  const textColor = colors.neutral.c100;

  return {
    bgColor,
    textColor,
    statusText,
  };
}

export default function usePerformanceReportsLog(limit = 40) {
  const [items, setItems] = useState<PerformanceEventRenderable[]>([]);
  const [lastCompleteRenderPassReport, setLastCompleteRenderPassReport] =
    useState<RenderPassReport>();
  const [timeToBootJs, setTimeToBootJs] = useState<number>();

  const addItem = useCallback(
    (item: PerformanceEventRenderable) => {
      if (item.report.interactive) {
        setLastCompleteRenderPassReport(item.report);
      }
      if (item.report.timeToBootJsMillis) {
        setTimeToBootJs(item.report.timeToBootJsMillis);
      }
      setItems(currentItems => [...currentItems.slice(-(limit - 1)), item]);
    },
    [limit],
  );
  useEffect(() => {
    const subscription = performanceReportSubject.subscribe(addItem);
    return () => subscription.unsubscribe();
  }, [addItem]);

  return {
    items,
    lastReportEvent: items[items.length - 1],
    lastCompleteRenderPassReport,
    timeToBootJs,
  };
}
