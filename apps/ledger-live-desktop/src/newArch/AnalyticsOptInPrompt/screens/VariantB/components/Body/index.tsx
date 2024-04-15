import React from "react";
import { HeaderTitle, RevokeInfoField } from "LLD/AnalyticsOptInPrompt/screens/components";
import { Flex, Text, Box } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";

const BodyBox = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow-y: auto;
  max-height: calc(100vh - 54%);
`;

interface BodyProps {
  title: string;
  description: string;
  listItems: string[];
  handleOpenPrivacyPolicy: () => void;
}

const Body = ({ title, description, listItems, handleOpenPrivacyPolicy }: BodyProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <>
      <Flex flexDirection={"column"} rowGap={"16px"}>
        <HeaderTitle title={title} />
        <Text variant={"bodyLineHeight"} fontWeight={"medium"} color={colors.neutral.c80}>
          {t(description)}
        </Text>
      </Flex>
      <BodyBox mb={"80px"} pb={"20px"}>
        <ul style={{ marginLeft: "5%" }}>
          {listItems.map((item, index) => (
            <li
              key={index}
              style={{ marginBottom: index !== listItems.length - 1 ? "16px" : "0px" }}
            >
              <Text
                variant={"bodyLineHeight"}
                fontWeight={"medium"}
                color={colors.neutral.c80}
                style={{ lineHeight: "21px" }}
              >
                {t(item)}
              </Text>
            </li>
          ))}
        </ul>
        <RevokeInfoField handleOpenPrivacyPolicy={handleOpenPrivacyPolicy} />
      </BodyBox>
    </>
  );
};

export default Body;
