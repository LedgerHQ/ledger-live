import React from "react";
import { useGeneralSectionViewModel } from "../useGeneralSectionViewModel";
import { GeneralView } from "./GeneralView";
import { useRegionPickerViewModel } from "./useRegionPickerViewModel";

type GeneralProps = Readonly<{ testID?: string }>;

/** The General tab of the desktop Settings page. */
export function General({ testID }: GeneralProps) {
  return (
    <GeneralView
      {...useGeneralSectionViewModel()}
      region={useRegionPickerViewModel()}
      testID={testID}
    />
  );
}
