import React from "react";
import { Flex, Text, Icons } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type Props = {
  onGetHelp: () => void;
};

const InteractFlex = styled(Flex)`
  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.colors.palette.opacityDefault.c10};
  }
  padding: 8px;
  background-color: ${({ theme }) => theme.colors.palette.opacityDefault.c05};
  border-radius: 8px;
  column-gap: 8px;
  align-items: center;

  &:active {
    background-color: ${({ theme }) => theme.colors.palette.opacityDefault.c20};
  }
`;

const StyledText = styled(Text)`
  word-break: break-all;
`;

const HelpSection = ({ onGetHelp }: Props) => {
  const { t } = useTranslation();
  return (
    <Flex
      alignItems="start"
      flexDirection="column"
      rowGap={2}
      bg="opacityDefault.c05"
      borderRadius={8}
      justifyContent="space-between"
      p={2}
      minHeight="128px"
      flex={1}
    >
      <Text variant="bodyLineHeight" fontSize={13}>
        {t("errors.TransactionBroadcastError.helpCenterTitle")}
        <Text color="neutral.c70">{t("errors.TransactionBroadcastError.helpCenterDesc")}</Text>
      </Text>
      <InteractFlex onClick={onGetHelp}>
        <Icons.Support color="neutral.c100" size="S" />
        <StyledText variant="bodyLineHeight" fontSize={13}>
          {t("errors.TransactionBroadcastError.getHelp")}
        </StyledText>
      </InteractFlex>
    </Flex>
  );
};

export default HelpSection;
