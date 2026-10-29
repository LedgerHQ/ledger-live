import React from "react";
import { MockServerOverlayView } from "./MockServerOverlayView";
import { useMockServerOverlayViewModel } from "./useMockServerOverlayViewModel";

export function MockServerOverlay() {
  return <MockServerOverlayView {...useMockServerOverlayViewModel()} />;
}
