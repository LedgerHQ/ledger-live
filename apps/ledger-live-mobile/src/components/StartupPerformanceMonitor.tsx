import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { getTimeSinceStartup } from "react-native-startup-time";

interface StartupMetrics {
  jsBundleLoadTime?: number;
  firstRenderTime?: number;
  storeInitTime?: number;
  totalStartupTime?: number;
}

export const StartupPerformanceMonitor: React.FC = () => {
  const metricsRef = useRef<StartupMetrics>({});
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const measureStartupTime = async () => {
      try {
        const nativeStartupTime = await getTimeSinceStartup();
        metricsRef.current.jsBundleLoadTime = nativeStartupTime;
        metricsRef.current.firstRenderTime = Date.now() - startTimeRef.current;

        // Log metrics in development
        if (__DEV__) {
          console.log("🚀 Startup Performance Metrics:", {
            platform: Platform.OS,
            jsBundleLoadTime: `${nativeStartupTime}ms`,
            firstRenderTime: `${metricsRef.current.firstRenderTime}ms`,
            totalStartupTime: `${Date.now() - startTimeRef.current}ms`,
          });
        }

        // Send metrics to analytics in production
        if (!__DEV__) {
          // You can integrate with your analytics service here
          // Example: Analytics.track('app_startup_performance', metricsRef.current);
        }
      } catch (error) {
        console.warn("Failed to measure startup time:", error);
      }
    };

    // Measure after initial render
    const timer = setTimeout(measureStartupTime, 100);
    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
};

export default StartupPerformanceMonitor;
