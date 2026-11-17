import React from "react";
import type { MockServerSettingsFormProps } from "./types";
import { MockServerSettingsFormView } from "./MockServerSettingsFormView";
import { useMockServerSettingsFormViewModel } from "./useMockServerSettingsFormViewModel";

export function MockServerSettingsForm(props: MockServerSettingsFormProps) {
  return <MockServerSettingsFormView {...useMockServerSettingsFormViewModel(props)} />;
}
