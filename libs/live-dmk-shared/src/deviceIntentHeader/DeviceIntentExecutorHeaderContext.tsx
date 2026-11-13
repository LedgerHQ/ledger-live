import React from "react";
import type { DeviceIntentExecutorHeaderContextValue } from "./types";

export const DeviceIntentExecutorHeaderContext = React.createContext<
  DeviceIntentExecutorHeaderContextValue | undefined
>(undefined);
