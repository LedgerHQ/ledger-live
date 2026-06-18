import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import RevokeInfoField from "LLD/features/AnalyticsOptInPrompt/screens/components/RevokeInfoField";
import { TrackingInfoList } from "./components";

const BodyBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow-y: auto;
  max-height: calc(100vh - 30%);
`;

interface MainBodyProps {
  handleOpenPrivacyPolicy: () => void;
}

const MainBody = ({ handleOpenPrivacyPolicy }: MainBodyProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const fields = {
    whatWeTrack: [
      t("analyticsOptInPrompt.main.whatWeTrackList.1"),
      t("analyticsOptInPrompt.main.whatWeTrackList.2"),
    ],
    whatWeDoNotTrack: [
      t("analyticsOptInPrompt.main.whatWeDoNotTrackList.1"),
      t("analyticsOptInPrompt.main.whatWeDoNotTrackList.2"),
      t("analyticsOptInPrompt.main.whatWeDoNotTrackList.3"),
    ],
  };

  return (
    <BodyBox mb={"80px"} pb={"20px"}>
      <Text variant="bodyLineHeight" fontWeight="medium" color={colors.neutral.c80} fontSize={14}>
        {t("analyticsOptInPrompt.main.description")}
      </Text>
      <TrackingInfoList
        title={t("analyticsOptInPrompt.main.whatWeTrack")}
        items={fields.whatWeTrack}
        variant="success"
      />
      <TrackingInfoList
        title={t("analyticsOptInPrompt.main.whatWeDoNotTrack")}
        items={fields.whatWeDoNotTrack}
        variant="error"
      />
      <RevokeInfoField handleOpenPrivacyPolicy={handleOpenPrivacyPolicy} />
    </BodyBox>
  );
};

export default MainBody;
