import React from "react";
import { HeaderTitle } from "LLD/features/AnalyticsOptInPrompt/screens/components";
import { Flex } from "@ledgerhq/react-ui";
import Track from "~/renderer/analytics/Track";
import {
  ANALYTICS_OPT_IN_PREFERENCES_COPY_KEYS,
  AnalyticsOptInPreferencesLegacySetup,
} from "LLD/features/AnalyticsOptInPrompt/components/AnalyticsOptInPreferencesSetup";
import { FieldKeySwitch } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";

interface ManagePreferencesProps {
  onPreferencesChange: (preferences: Record<FieldKeySwitch, boolean>) => void;
  shouldWeTrack: boolean;
  handleOpenPrivacyPolicy: (page: string) => void;
}

const page = "Analytics opt-in prompt details";

const ManagePreferences = ({
  onPreferencesChange,
  shouldWeTrack,
  handleOpenPrivacyPolicy,
}: ManagePreferencesProps) => (
  <>
    <Track onMount mandatory={shouldWeTrack} event={page} page={page} />
    <Flex flexDirection={"column"} rowGap={"32px"} mx={"40px"} height={"100%"}>
      <HeaderTitle title={"analyticsOptInPrompt.screen.managePreferences"} />
      <AnalyticsOptInPreferencesLegacySetup
        copyKeys={ANALYTICS_OPT_IN_PREFERENCES_COPY_KEYS.legacy}
        onPreferencesChange={onPreferencesChange}
        onOpenTrackingPolicy={() => handleOpenPrivacyPolicy(page)}
      />
    </Flex>
  </>
);

export default ManagePreferences;
