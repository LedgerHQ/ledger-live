import React from "react";
import { MockServerFloatingBarView } from "./MockServerFloatingBarView";
import {
  type MockServerFloatingBarProps,
  useMockServerFloatingBarViewModel,
} from "./useMockServerFloatingBarViewModel";

export function MockServerFloatingBar(props: Readonly<MockServerFloatingBarProps>) {
  return <MockServerFloatingBarView {...useMockServerFloatingBarViewModel(props)} />;
}
