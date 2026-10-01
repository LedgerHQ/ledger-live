import { TrackScreen } from "@shared/analytics-react";
import React from "react";
import AppVersionRow from "./AppVersionRow";
import PrivacyPolicyRow from "./PrivacyPolicyRow";
import TermsConditionsRow from "./TermsConditionsRow";
import SettingsNavigationScrollView from "../SettingsNavigationScrollView";

export default function About() {
  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="About" />
      <AppVersionRow />
      <TermsConditionsRow />
      <PrivacyPolicyRow />
    </SettingsNavigationScrollView>
  );
}
