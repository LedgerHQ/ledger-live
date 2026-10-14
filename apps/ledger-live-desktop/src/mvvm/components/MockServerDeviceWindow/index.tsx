import React from "react";
import { MockServerDeviceWindowView } from "./MockServerDeviceWindowView";
import { useMockServerDeviceWindowViewModel } from "./useMockServerDeviceWindowViewModel";

/** Floating live screen of the device the mock server transport is driving. */
export function MockServerDeviceWindow() {
  const viewModel = useMockServerDeviceWindowViewModel();
  return <MockServerDeviceWindowView viewModel={viewModel} />;
}
