import { Decorator } from "@storybook/react";
import React, { createContext, useMemo } from "react";
import { BehaviorSubject } from "rxjs";

export type DeviceStatus = { type: "LOADING"; payload?: any };

export const MockDeviceContext = createContext(
  new BehaviorSubject<DeviceStatus>({ type: "LOADING" }),
);

export const MockDeviceProvider: Decorator = (Story, { parameters }) => {
  const useHook = useMemo(
    () => parameters.deviceStatus ?? new BehaviorSubject({ type: "LOADING" }),
    [parameters.deviceStatus],
  );

  return (
    <MockDeviceContext.Provider value={useHook}>
      <Story />
    </MockDeviceContext.Provider>
  );
};
