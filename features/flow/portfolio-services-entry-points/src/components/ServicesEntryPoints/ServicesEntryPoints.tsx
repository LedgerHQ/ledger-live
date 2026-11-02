import React from "react";
import type { ServicesEntryPointsProps } from "./ServicesEntryPoints.types";
import { ServicesEntryPointsView } from "./ServicesEntryPointsView";
import { useServicesEntryPointsViewModel } from "./useServicesEntryPointsViewModel";

export function ServicesEntryPoints(props: ServicesEntryPointsProps) {
  return <ServicesEntryPointsView {...useServicesEntryPointsViewModel(props)} />;
}
