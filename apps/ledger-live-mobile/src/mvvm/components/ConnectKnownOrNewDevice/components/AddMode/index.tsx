import React from "react";
import { AddModeView } from "./AddModeView";
import type { AddModeProps } from "./types";
import { useAddModeViewModel } from "./useAddModeViewModel";

/** The Add mode of the device list: the connectivity screen, embedded, under a close bar. */
export function AddMode(props: Readonly<AddModeProps>): React.JSX.Element {
  return <AddModeView {...useAddModeViewModel(props)} />;
}
