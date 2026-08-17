import React from "react";
import { FeatureToggle } from "@features/platform-feature-flags";
import { NotificationsPromptDrawer } from "LLM/features/NotificationsPrompt/screens/NotificationsPromptDrawer";

export function NotificationsPromptWrapper() {
  return (
    <FeatureToggle featureId="brazePushNotifications">
      <NotificationsPromptDrawer />
    </FeatureToggle>
  );
}
