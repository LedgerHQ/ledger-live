/* eslint-disable @typescript-eslint/no-explicit-any */
import { register } from "react-native-bundle-splitter";

const moduleLoadTimes = new Map<string, number>();

type RegisterConfig = {
  loader: () => Promise<any>;
  name: string;
  placeholder?: React.ReactNode;
  group?: string;
  cached?: boolean;
};

export function registerAppScreen<T extends React.ComponentType<any>>(config: RegisterConfig) {
  if (__DEV__) {
    const originalLoader = config.loader;
    config.loader = async () => {
      const startTime = performance.now();
      const result = await originalLoader();
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      moduleLoadTimes.set(config.name, loadTime);
      // eslint-disable-next-line no-console
      console.info(`Module ${config.name} loaded in ${loadTime}ms`);

      return result;
    };
  }
  return register<React.ComponentProps<T>>(config);
}
