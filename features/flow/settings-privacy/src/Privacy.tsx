import React from "react";
import type { PrivacyProps } from "./Privacy.types";
import { PrivacyView } from "./PrivacyView";
import { usePrivacyViewModel } from "./usePrivacyViewModel";

/** The Privacy section of the new Settings: reads and changes the settings through the app port. */
export function Privacy(props: PrivacyProps) {
  return <PrivacyView {...usePrivacyViewModel(props)} />;
}
