import React, { createContext, useState } from "react";

type Context = {
  source?: string;
  screen?: string;
  setSource: (_?: string) => void;
  setScreen?: (_?: string) => void;
};

export const AnalyticsContext = createContext<Context>({
  source: undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSource: () => {},
});

export const AnalyticsContextProvider: React.FC<{ children: React.ReactNode | null }> = ({
  children,
}) => {
  const [analyticsSource, setAnalyticsSource] = useState<undefined | string>(undefined);
  const [analyticsScreen, setAnalyticsScreen] = useState<undefined | string>(undefined);
  return (
    <AnalyticsContext.Provider
      value={{
        source: analyticsSource,
        screen: analyticsScreen,
        setSource: setAnalyticsSource,
        setScreen: setAnalyticsScreen,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};
