import React from "react";
import { Box, Button, IconsLegacy } from "@ledgerhq/react-ui";
import styled from "styled-components";

const CloseContainer = styled(Box).attrs(() => ({
  top: 7,
  right: 7,
  position: "absolute",
}))``;

export default function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <CloseContainer>
      <Button.Unstyled onClick={onClick}>
        <IconsLegacy.CloseMedium size={20} />
      </Button.Unstyled>
    </CloseContainer>
  );
}
