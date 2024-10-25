import React, { useState } from "react";
import { Flex, Text, Icons } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useCopyToClipboard } from "~/newArch/hooks/useCopyToClipboard";

type Props = {
  error: Error;
  onSaveLogs: () => void;
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
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
    <Flex
      alignItems="flex-start"
      flexDirection="column"
      bg="opacityDefault.c05"
      borderRadius={8}
      justifyContent="space-between"
      p={2}
    >
      <StyledText variant="bodyLineHeight" fontSize={13} width="100%">
        {t("errors.TransactionBroadcastError.technicalErrorTitle")}
        <Text color="neutral.c70">{error.message}</Text>
      </StyledText>
      <Flex columnGap={2}>
        <InteractFlex onClick={onSaveLogs}>
          <Icons.Download color="neutral.c100" size="S" />
          <Text variant="bodyLineHeight" fontSize={13}>
            {t("errors.TransactionBroadcastError.saveLogs")}
          </Text>
        </InteractFlex>
        <InteractFlex onClick={handleCopyError}>{icon}</InteractFlex>
      </Flex>
    </Flex>
  );
};

export default TechnicalErrorSection;
