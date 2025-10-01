import { usePerformanceMonitorDevTools } from "@rozenite/performance-monitor-plugin";
import { useNetworkActivityDevTools } from "@rozenite/network-activity-plugin";
import { useReactNavigationDevTools } from "@rozenite/react-navigation-plugin";
import { navigationRef } from "~/rootnavigation";

const config = {
  inspectors: {
    http: true,
    websocket: false,
    sse: false,
  },
};

const HookDevTools = () => {
  useNetworkActivityDevTools({
    inspectors: config.inspectors,
  });

  useReactNavigationDevTools({ ref: navigationRef });

  usePerformanceMonitorDevTools();

  return null;
};

export default HookDevTools;

/**
 * For performance monitoring, we can use the following metrics:
 *
 * 0. import performance from 'react-native-performance';
 *
 * 1. performance.mark('app-start');
 * 2. performance.mark('data-loaded');
 * 3. performance.measure('app-initialization', 'app-start', 'data-loaded');
 * 4. performance.metric('custom-metric', 42, { detail: 'Additional info' });
 *
 */
