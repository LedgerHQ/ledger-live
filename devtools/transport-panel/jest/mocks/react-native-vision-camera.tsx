import React from "react";
import { View } from "react-native";

export const Camera = Object.assign(
  ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
  { requestCameraPermission: jest.fn().mockResolvedValue("granted") },
);

export const useCameraDevice = jest.fn().mockReturnValue(undefined);
export const useCameraPermission = jest.fn().mockReturnValue({ hasPermission: false });
export const useCodeScanner = jest.fn().mockReturnValue({});
