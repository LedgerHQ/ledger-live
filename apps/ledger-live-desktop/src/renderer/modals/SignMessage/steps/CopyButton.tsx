import React, { useState, useCallback } from "react";
import styled from "styled-components";
import Button from "~/renderer/components/Button";
import { Icons } from "@ledgerhq/react-ui";

type Props = {
  text: string;
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
    <ButtonContainer onClick={handleCopy}>
      {copied ? (
        <>
          <Icons.Check size={"S"} color="success.c50" />
          <StyledText copied={true}>Copied!</StyledText>
        </>
      ) : (
        <>
          <Icons.Copy size={"S"} color="neutral.c90" />
          <StyledText copied={false}>Copy</StyledText>
        </>
      )}
    </ButtonContainer>
  );
}
const StyledText = styled.span<{ copied: boolean }>`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.c90};
  padding-left: 8px;
`;

const ButtonContainer = styled(Button)`
  position: sticky;
  top: 30px;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px;
  border: none;
  z-index: 10;
  cursor: pointer;
  box-shadow: 0px 1px 1px rgba(177, 143, 143, 0.1);

  &:hover {
    background-color: ${({ theme }) => theme.colors.palette.action.hover};
  }

  &:active {
    background-color: ${({ theme }) => theme.colors.palette.action.active};
  }
`;
