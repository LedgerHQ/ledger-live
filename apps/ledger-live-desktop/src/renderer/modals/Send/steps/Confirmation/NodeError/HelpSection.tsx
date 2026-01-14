import React from "react";
import { Flex, Text, Icons } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type Props = {
  onGetHelp: () => void;
};

const Container = styled(Flex)`
  --line-clamp: 2;

  &:hover {
    --line-clamp: unset;
  }
`;

const InteractFlex = styled(Flex)`
  height: 40px;
  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.colors.opacityDefault.c10};
  }
  padding: 8px;
  background-color: ${({ theme }) => theme.colors.opacityDefault.c05};
  border-radius: 8px;
  column-gap: 8px;
  align-items: center;

  &:active {
    background-color: ${({ theme }) => theme.colors.opacityDefault.c20};
  }
`;

const StyledText = styled(Text)`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--line-clamp);
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 6px;
`;

const HelpSection = ({ onGetHelp }: Props) => {
  const { t } = useTranslation();
  return (
    <Container
      flexDirection="row"
      bg="opacityDefault.c05"
      borderRadius={8}
      justifyContent="space-between"
      p={3}
      flex={1}
      mb={2}
      width="100%"
    >
      <Flex flexShrink={1}>
        <StyledText variant="bodyLineHeight" fontSize={13} flex={1} color="neutral.c70">
          <Text color="neutral.c100">{t("errors.TransactionBroadcastError.helpCenterTitle")}</Text>
          <Text color="neutral.c70">{t("errors.TransactionBroadcastError.helpCenterDesc")}</Text>
        </StyledText>
      </Flex>
      <InteractFlex onClick={onGetHelp} flexShrink={0} flexGrow={0} alignSelf={"start"}>
        <Icons.Support color="neutral.c100" size="S" />
        <StyledText variant="bodyLineHeight" fontSize={13}>
          {t("errors.TransactionBroadcastError.getHelp")}
        </StyledText>
      </InteractFlex>
    </Container>
  );
};

export default HelpSection;
