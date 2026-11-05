import React from "react";
import { Platform } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

export function MockServerOverlayContainer({ children }: Readonly<{ children: React.ReactNode }>) {
  if (Platform.OS === "ios") return <FullWindowOverlay>{children}</FullWindowOverlay>;
  return <>{children}</>;
}
