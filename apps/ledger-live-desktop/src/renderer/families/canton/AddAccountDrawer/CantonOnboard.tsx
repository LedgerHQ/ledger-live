import React from "react";
import CantonOnboardView from "./CantonOnboardView";
import {
  useCantonOnboardViewModel,
  type CantonOnboardProps,
} from "./hooks/useCantonOnboardViewModel";

export type { CantonOnboardProps };

export default function CantonOnboard(props: CantonOnboardProps) {
  return <CantonOnboardView {...useCantonOnboardViewModel(props)} />;
}
