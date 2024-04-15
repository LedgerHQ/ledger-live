import React, { useCallback, useState } from "react";
import { Box, Text, Flex, Switch } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import { useTranslation } from "react-i18next";
import RevokeInfoField from "LLD/AnalyticsOptInPrompt/screens/components/RevokeInfoField";
import { FieldKeySwitch } from "LLD/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";

const BodyBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  max-height: calc(100vh - 26%);
`;

interface ManagePreferencesBodyProps {
  onSwitchChange: (key: FieldKeySwitch) => void;
  handleOpenPrivacyPolicy: () => void;
}

const ManagePreferencesBody = ({
  onSwitchChange,
  handleOpenPrivacyPolicy,
}: ManagePreferencesBodyProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [checked, setChecked] = useState<Record<FieldKeySwitch, boolean>>({
    AnalyticsData: false,
    PersonalizationData: false,
  });

  const onClick = useCallback(
    (key: FieldKeySwitch) => {
      setChecked(prevChecked => ({ ...prevChecked, [key]: !prevChecked[key] }));
      onSwitchChange(key);
    },
    [onSwitchChange],
  );

  const fields: Record<FieldKeySwitch, { title: string; description: string }> = {
    AnalyticsData: {
      title: "analyticsOptInPrompt.variantA.analyticsData.title",
      description: "analyticsOptInPrompt.variantA.analyticsData.description",
    },
    PersonalizationData: {
      title: "analyticsOptInPrompt.variantA.personalizationData.title",
      description: "analyticsOptInPrompt.variantA.personalizationData.description",
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
                  onChange={() => onClick(key)}
                  name={key}
                  checked={checked[key]}
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
      <RevokeInfoField handleOpenPrivacyPolicy={handleOpenPrivacyPolicy} />
    </BodyBox>
  );
};

export default ManagePreferencesBody;
