import React from "react";
import { GeneralView } from "./GeneralView";
import { useGeneralSectionSheetsViewModel } from "./useGeneralSectionSheetsViewModel";

export type GeneralProps = Readonly<{ testID?: string }>;

/** The General section of the mobile Settings, reading and writing the app's settings port. */
export function General({ testID }: GeneralProps) {
  return <GeneralView {...useGeneralSectionSheetsViewModel()} testID={testID} />;
}
