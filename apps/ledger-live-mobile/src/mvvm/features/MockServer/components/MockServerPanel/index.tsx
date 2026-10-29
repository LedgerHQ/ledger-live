import React from "react";
import { MockServerPanelView } from "./MockServerPanelView";
import {
  type MockServerPanelProps,
  useMockServerPanelViewModel,
} from "./useMockServerPanelViewModel";

export function MockServerPanel(props: MockServerPanelProps) {
  return <MockServerPanelView {...useMockServerPanelViewModel(props)} />;
}
