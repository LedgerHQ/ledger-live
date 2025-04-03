import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { Icons, Button, Flex } from "@ledgerhq/react-ui";
import { t } from "i18next";

type Props = {
  readonly text: string;
};

export default function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }, [text]);

  return (
    <ButtonContainer variant="shade" onClick={handleCopy}>
      <ContentWrapper data-testid="copy-wrapper">
        {copied ? (
          <>
            <Icons.Check size={"S"} color="success.c50" />
            <StyledText copied={true}>{t("common.copied")}</StyledText>
          </>
        ) : (
          <>
            <Icons.Copy size={"S"} color="neutral.c90" />
            <StyledText copied={false}>{t("common.copy")}</StyledText>
          </>
        )}
      </ContentWrapper>
    </ButtonContainer>
  );
}

const ContentWrapper = styled(Flex)`
  align-items: center;
  justify-content: center;
`;

const StyledText = styled.span<{ copied: boolean }>`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.c90};
  padding-left: 8px;
`;

const ButtonContainer = styled(Button)`
  position: sticky;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  border: none;
  display: block;
  height: 36px;
  background-color: ${({ theme }) => theme.colors.neutral.c30};
`;
