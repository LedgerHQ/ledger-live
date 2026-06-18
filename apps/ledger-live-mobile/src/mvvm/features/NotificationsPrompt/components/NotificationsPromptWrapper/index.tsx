import React from "react";
import { FeatureToggle } from "@features/platform-feature-flags";
import { NotificationsPromptBootstrap } from "LLM/features/NotificationsPrompt/components/NotificationsPromptBootstrap";
import { NotificationsPromptDrawer } from "LLM/features/NotificationsPrompt/screens/NotificationsPromptDrawer";

export function NotificationsPromptWrapper() {
  return (
    <FeatureToggle featureId="brazePushNotifications">
      <NotificationsPromptBootstrap />
      <NotificationsPromptDrawer />
    </FeatureToggle>
  );
}
