import React from "react";
import { Platform } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

/**
 * On iOS, a separate top-level window keeps the overlay above native `Modal`s.
 * Android has no equivalent, so `QueuedDrawer` also mounts the overlay inside its `Modal`.
 */
export function MockServerOverlayContainer({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "ios") return <FullWindowOverlay>{children}</FullWindowOverlay>;
  return <>{children}</>;
}
