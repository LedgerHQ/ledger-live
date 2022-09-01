import { createContext } from "react";

export const AnalyticsContext = createContext<{
  source?: string;
  screen?: string;
  setSource: (_?: string) => void;
  setScreen?: (_?: string) => void;
}>({
  source: undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSource: () => {},
});
