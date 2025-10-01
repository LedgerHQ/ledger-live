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
