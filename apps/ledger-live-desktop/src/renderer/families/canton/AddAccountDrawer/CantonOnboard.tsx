import React from "react";
import CantonOnboardView from "./CantonOnboardView";
import {
  useCantonOnboardViewModel,
  type CantonOnboardProps,
} from "./hooks/useCantonOnboardViewModel";

export type { CantonOnboardProps } from "./hooks/useCantonOnboardViewModel";

export default function CantonOnboard(props: Readonly<CantonOnboardProps>) {
  return <CantonOnboardView {...useCantonOnboardViewModel(props)} />;
}
