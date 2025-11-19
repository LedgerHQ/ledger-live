import React, { useEffect, useState } from "react";
import { register, preload, isCached } from "react-native-bundle-splitter";
import { Loader } from "LLM/components/Loader";

const TIME_BEFORE_LOADER = 1000;

const Placeholder = () => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(true);
    }, TIME_BEFORE_LOADER);

    return () => clearTimeout(timer);
  }, []);

  if (!showLoader) {
    return null;
  }

  return <Loader />;
};

export function lazyLoad<T extends React.ComponentType>(...args: Parameters<typeof register>) {
  const placeholder = <Placeholder />;
  if (typeof args[0] === "object" && args[0] !== null) {
    return register<React.ComponentProps<T>>({
      ...args[0],
      placeholder,
    });
  }
  return register<React.ComponentProps<T>>(...args);
}

export enum PRELOAD_SCREEN_NAMES {
  SettingsNavigator = "SettingsNavigator",
  EarnLiveAppNavigator = "EarnLiveAppNavigator",
  ExchangeLiveAppNavigator = "ExchangeLiveAppNavigator",
}

export function preloadLazyLoad(name: keyof typeof PRELOAD_SCREEN_NAMES): void {
  if (!isCached(PRELOAD_SCREEN_NAMES[name])) {
    preload().component(PRELOAD_SCREEN_NAMES[name]);
  }
}
