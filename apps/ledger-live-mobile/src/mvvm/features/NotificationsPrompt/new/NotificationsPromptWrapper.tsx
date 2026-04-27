import React from "react";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import { NotificationsPromptDrawer } from "LLM/features/NotificationsPrompt/screens/NotificationsPromptDrawer";
import { NotificationsPromptBootstrap } from "LLM/features/NotificationsPrompt/new/NotificationsPromptBootstrap";

export function NotificationsPromptWrapper() {
  return (
    <FeatureToggle featureId="brazePushNotifications">
      <NotificationsPromptBootstrap />
      <NotificationsPromptDrawer />
    </FeatureToggle>
  );
}
