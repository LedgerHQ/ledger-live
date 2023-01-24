// @flow

import styled from "styled-components";
import Text from "~/renderer/components/Text";
import { focusedShadowStyle } from "~/renderer/components/Box/Tabbable";
import Box from "~/renderer/components/Box";
import React from "react";

const BodyText = styled(Text).attrs(p => ({
  fontSize: 4,
  fontWeight: "medium",
  color: p.theme.colors.neutral.c70,
  textAlign: "left",
}))``;

const TitleText = styled(Text).attrs(p => ({
  fontSize: 4,
  fontWeight: "semiBold",
  color: p.theme.colors.neutral.c100,
  mb: "2px",
}))``;

const EntryButtonContainer = styled.button`
  cursor: pointer;
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  align-items: center;
  border: none;
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-radius: 4px;
  padding: ${p => p.theme.space[3]}px;
  gap: ${p => p.theme.space[3]}px;

  &:disabled {
    cursor: not-allowed;
    background-color: ${p => p.theme.colors.neutral.c30};

    ${TitleText} {
      color: ${p => p.theme.colors.neutral.c50};
    }

    ${BodyText} {
      color: ${p => p.theme.colors.neutral.c50};
    }
  }

  &:focus {
    box-shadow: ${focusedShadowStyle};
  }

  &:focus:not(:focus-visible) {
    outline: 0;
    box-shadow: none;
  }

  &:hover:enabled {
    color: ${p => p.theme.colors.primary.c90};
    background-color: ${p => p.theme.colors.primary.c10};

    ${TitleText} {
      color: ${p => p.theme.colors.primary.c90};
    }

    ${BodyText} {
      color: ${p => p.theme.colors.primary.c80};
    }
  }
`;

const EntryButton = ({
  title,
  body,
  onClick,
  disabled,
}: {
  title: string,
  body: string,
  onClick: () => void,
  disabled?: boolean,
}) => {
  return (
    <EntryButtonContainer onClick={onClick} disabled={disabled}>
      <div>Icon</div>
      <Box shrink style={{ alignItems: "flex-start" }}>
        <TitleText>{title}</TitleText>
        <BodyText>{body}</BodyText>
      </Box>
    </EntryButtonContainer>
  );
};

export default EntryButton;
