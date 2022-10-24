import { createContext } from "react";

export type Context = {
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
