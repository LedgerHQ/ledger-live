import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import RevokeInfoField from "LLD/AnalyticsOptInPrompt/screens/components/RevokeInfoField";
import { TrackingInfoList } from "./components";

const BodyBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow-y: auto;
  max-height: calc(100vh - 26%);
`;

interface MainBodyProps {
  handleOpenPrivacyPolicy: () => void;
}

const MainBody = ({ handleOpenPrivacyPolicy }: MainBodyProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const fields = {
    whatWeTrack: [
      t("analyticsOptInPrompt.variantA.whatWeTrackList.1"),
      t("analyticsOptInPrompt.variantA.whatWeTrackList.2"),
    ],
    whatWeDoNotTrack: [
      t("analyticsOptInPrompt.variantA.whatWeDoNotTrackList.1"),
      t("analyticsOptInPrompt.variantA.whatWeDoNotTrackList.2"),
      t("analyticsOptInPrompt.variantA.whatWeDoNotTrackList.3"),
    ],
  };

  return (
    <BodyBox mb={"80px"} pb={"20px"}>
      <Text variant="bodyLineHeight" fontWeight="medium" color={colors.neutral.c80} fontSize={14}>
        {t("analyticsOptInPrompt.variantA.description")}
      </Text>
      <TrackingInfoList
        title={t("analyticsOptInPrompt.variantA.whatWeTrack")}
        items={fields.whatWeTrack}
        variant="success"
      />
      <TrackingInfoList
        title={t("analyticsOptInPrompt.variantA.whatWeDoNotTrack")}
        items={fields.whatWeDoNotTrack}
        variant="error"
      />
      <RevokeInfoField handleOpenPrivacyPolicy={handleOpenPrivacyPolicy} />
    </BodyBox>
  );
};

export default MainBody;
