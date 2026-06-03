import React from "react";
import CounterfeitWarningDialogView from "./CounterfeitWarningDialogView";
import useCounterfeitWarningDialogViewModel from "./useCounterfeitWarningDialogViewModel";
import type { CounterfeitWarningDialogContainerProps } from "./useCounterfeitWarningDialogViewModel";

const CounterfeitWarningDialog = (props: CounterfeitWarningDialogContainerProps) => (
  <CounterfeitWarningDialogView {...useCounterfeitWarningDialogViewModel(props)} />
);

export default CounterfeitWarningDialog;
