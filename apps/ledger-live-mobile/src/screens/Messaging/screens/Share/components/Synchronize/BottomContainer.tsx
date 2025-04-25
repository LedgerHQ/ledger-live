import React from "react";
import { ScrollContainer, Text, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components/native";

type Props = {
  steps: {
    description: React.JSX.Element;
  }[];
};

const BulletPoint = styled(Flex)`
  width: 16px;
  height: 16px;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.primary.c80};
  border-radius: 100px;
`;

const FlexContainer = styled(Flex)`
  margin-bottom: 16px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
`;

const BottomContainer = ({ steps }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollContainer
      px={16}
      py={24}
      maxHeight={70}
      background={colors.opacityDefault.c05}
      borderRadius={24}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="h4" fontSize={18} color={colors.neutral.c100} mb={24}>
        Scan a QR Code to join a conversation
      </Text>
    </ScrollContainer>
  );
};

export default BottomContainer;
