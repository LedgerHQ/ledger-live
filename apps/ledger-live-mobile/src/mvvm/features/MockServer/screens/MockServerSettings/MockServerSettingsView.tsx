import React from "react";
import {
  MockServerSettingsForm,
  type MockServerSettingsFormProps,
} from "@features/flow-device-mock-server";
import SettingsNavigationScrollView from "~/screens/Settings/SettingsNavigationScrollView";

export function MockServerSettingsView(props: MockServerSettingsFormProps) {
  return (
    <SettingsNavigationScrollView>
      <MockServerSettingsForm {...props} />
    </SettingsNavigationScrollView>
  );
}
