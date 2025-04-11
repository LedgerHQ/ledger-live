import React, { useState } from "react";
import { Box, Flex, Text, Icons } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useCopyToClipboard } from "LLD/hooks/useCopyToClipboard";

type Props = {
  error: Error;
  onSaveLogs: () => void;
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
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--line-clamp);
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 6px;
  word-break: break-word;
`;

const TechnicalErrorSection = ({ error, onSaveLogs }: Props) => {
  const { t } = useTranslation();
  const [icon, setIcon] = useState(<Icons.Copy color="neutral.c100" size="S" />);

  const copyToClipboard = useCopyToClipboard(_text => {
    setIcon(<Icons.Check color="success.c50" size="S" />);
    setTimeout(() => {
      setIcon(<Icons.Copy color="neutral.c100" size="S" />);
    }, 5000);
  });

  const handleCopyError = () => {
    copyToClipboard(error.message);
  };

  return (
    <Container
      flexDirection="row"
      bg="opacityDefault.c05"
      borderRadius={8}
      justifyContent="space-between"
      p={3}
      flex={1}
      width="100%"
    >
      <Box flexShrink={1}>
        <StyledText variant="bodyLineHeight" fontSize={13} flex={1} color="neutral.c70">
          <Text color="neutral.c100">
            {t("errors.TransactionBroadcastError.technicalErrorTitle")}
          </Text>
          <Text color="neutral.c70">{error.message}</Text>
        </StyledText>
      </Box>
      <Flex columnGap={2} alignSelf="start">
        <InteractFlex onClick={onSaveLogs} flexShrink={1}>
          <Icons.Download color="neutral.c100" size="S" />
          <Text variant="bodyLineHeight" fontSize={13}>
            {t("errors.TransactionBroadcastError.saveLogs")}
          </Text>
        </InteractFlex>
        <InteractFlex onClick={handleCopyError}>{icon}</InteractFlex>
      </Flex>
    </Container>
  );
};

export default TechnicalErrorSection;
