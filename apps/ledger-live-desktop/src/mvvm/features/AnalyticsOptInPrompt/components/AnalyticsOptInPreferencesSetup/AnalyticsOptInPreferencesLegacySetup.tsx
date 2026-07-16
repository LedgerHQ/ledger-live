import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Flex, Switch, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import RevokeInfoField from "LLD/features/AnalyticsOptInPrompt/screens/components/RevokeInfoField";
import { FieldKeySwitch } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import {
  AnalyticsOptInPreferencesCopyKeys,
  useAnalyticsOptInPreferencesSetup,
} from "./useAnalyticsOptInPreferencesSetup";

const BodyBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 26%);
`;

export type AnalyticsOptInPreferencesLegacySetupProps = Readonly<{
  copyKeys: AnalyticsOptInPreferencesCopyKeys;
  onPreferencesChange: (preferences: Record<FieldKeySwitch, boolean>) => void;
  onOpenTrackingPolicy: () => void;
}>;

export function AnalyticsOptInPreferencesLegacySetup({
  copyKeys,
  onPreferencesChange,
  onOpenTrackingPolicy,
}: AnalyticsOptInPreferencesLegacySetupProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { preferences, togglePreference } = useAnalyticsOptInPreferencesSetup(onPreferencesChange);

  const fields: Record<FieldKeySwitch, { title: string; description: string }> = {
    AnalyticsData: {
      title: copyKeys.analyticsTitle,
      description: copyKeys.analyticsDescription,
    },
    PersonalizationData: {
      title: copyKeys.personalizationTitle,
      description: copyKeys.personalizationDescription,
    },
  };

  return (
    <BodyBox mb={"80px"} pb={"20px"}>
      <Flex flexDirection={"column"} alignItems={"start"} rowGap={"24px"}>
        {(Object.keys(fields) as FieldKeySwitch[]).map(key => {
          const { title, description } = fields[key];
          return (
            <Flex key={key} flexDirection={"column"} alignItems={"start"} rowGap={"12px"}>
              <Flex
                borderRadius={"12px"}
                backgroundColor={colors.opacityDefault.c05}
                width={"100%"}
                p={"12px"}
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                <Text
                  variant={"body"}
                  fontWeight={"medium"}
                  fontSize={14}
                  color={colors.neutral.c100}
                >
                  {t(title)}
                </Text>
                <Switch
                  onChange={() => togglePreference(key)}
                  name={key}
                  checked={preferences[key]}
                  size={"normal"}
                />
              </Flex>
              <Text
                variant={"bodyLineHeight"}
                fontWeight={"medium"}
                color={colors.neutral.c70}
                fontSize={14}
              >
                {t(description)}
              </Text>
            </Flex>
          );
        })}
      </Flex>
      <RevokeInfoField handleOpenPrivacyPolicy={onOpenTrackingPolicy} />
    </BodyBox>
  );
}
