import React from "react";
import CounterfeitWarningDrawerView from "./CounterfeitWarningDrawerView";
import {
  useCounterfeitWarningDrawerViewModel,
  type CounterfeitWarningDrawerContainerProps,
} from "./useCounterfeitWarningDrawerViewModel";

const CounterfeitWarningDrawer = (props: CounterfeitWarningDrawerContainerProps) => (
  <CounterfeitWarningDrawerView {...useCounterfeitWarningDrawerViewModel(props)} />
);

export default CounterfeitWarningDrawer;
export type { CounterfeitWarningDrawerContainerProps } from "./useCounterfeitWarningDrawerViewModel";
