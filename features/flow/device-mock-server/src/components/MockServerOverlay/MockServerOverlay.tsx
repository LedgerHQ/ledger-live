import React from "react";
import { MockServerOverlayView } from "./MockServerOverlayView";
import type { MockServerOverlayProps } from "./types";
import { useMockServerOverlayViewModel } from "./useMockServerOverlayViewModel";

export function MockServerOverlay(props: MockServerOverlayProps) {
  return <MockServerOverlayView {...useMockServerOverlayViewModel(props)} />;
}
