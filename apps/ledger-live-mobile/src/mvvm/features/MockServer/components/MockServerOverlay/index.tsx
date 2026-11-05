import React from "react";
import { MockServerOverlay as MockServerOverlayFlow } from "@features/flow-device-mock-server";
import { useMockServerOverlayViewModel } from "./useMockServerOverlayViewModel";

export function MockServerOverlay() {
  const props = useMockServerOverlayViewModel();
  return props ? <MockServerOverlayFlow {...props} /> : null;
}
