import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import { Box } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import RevokeInfoField from "LLD/AnalyticsOptInPrompt/screens/components/RevokeInfoField";

const BodyBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow-y: auto;
  max-height: calc(100vh - 207px);
`;

const Field = styled(Text)`
  flex: 1;
`;

const MainBody = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const fields = {
    whatWeTrack: [
      t("analyticsOptInPrompt.variantA.whatWeTrackList.1"),
      t("analyticsOptInPrompt.variantA.whatWeTrackList.2"),
    ],
    fieldsWhatWeDoNotTrack: [
      t("analyticsOptInPrompt.variantA.whatWeDoNotTrackList.1"),
      t("analyticsOptInPrompt.variantA.whatWeDoNotTrackList.2"),
      t("analyticsOptInPrompt.variantA.whatWeDoNotTrackList.3"),
    ],
  };

  return (
    <BodyBox mb={"80px"} pb={"20px"}>
      <div>
        <Text variant="body" fontWeight="medium" color={colors.neutral.c80} fontSize={14}>
          {t("analyticsOptInPrompt.variantA.description")}
        </Text>
      </div>
      <div>
        <Text variant="body" fontWeight="medium" fontSize={14} color={colors.neutral.c100}>
          {t("analyticsOptInPrompt.variantA.whatWeTrack")}
        </Text>
        <Flex flexDirection={"column"} alignItems={"start"} rowGap={"24px"} py={"16px"}>
          {fields.whatWeTrack.map((text, index) => (
            <Flex key={index} columnGap={"8px"} alignItems={"center"}>
              <Icons.Check size={"S"} color={colors.success.c70} />
              <Field
                variant="paragraph"
                fontWeight="medium"
                fontSize={13}
                color={colors.neutral.c100}
              >
                {text}
              </Field>
            </Flex>
          ))}
        </Flex>
        <Flex flexDirection={"column"} alignItems={"start"} rowGap={"16px"}>
          <Text variant="body" fontWeight="medium" fontSize={14} color={colors.neutral.c100}>
            {t("analyticsOptInPrompt.variantA.whatWeDoNotTrack")}
          </Text>
          {fields.fieldsWhatWeDoNotTrack.map((text, index) => (
            <Flex key={index} columnGap={"8px"} alignItems={"center"}>
              <Icons.Close size={"S"} color={colors.error.c50} />
              <Field
                variant="paragraph"
                fontWeight="medium"
                fontSize={13}
                color={colors.neutral.c70}
              >
                {text}
              </Field>
            </Flex>
          ))}
        </Flex>
      </div>
      <RevokeInfoField />
    </BodyBox>
  );
};

export default MainBody;
