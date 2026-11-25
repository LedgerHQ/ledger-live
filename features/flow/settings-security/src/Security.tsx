import React from "react";
import type { SecurityProps } from "./Security.types";
import { SecurityView } from "./SecurityView";
import { useSecurityViewModel } from "./useSecurityViewModel";

/** The Security section of the new Settings: reads and changes the settings through the app port. */
export function Security(props: SecurityProps) {
  return <SecurityView {...useSecurityViewModel(props)} />;
}
