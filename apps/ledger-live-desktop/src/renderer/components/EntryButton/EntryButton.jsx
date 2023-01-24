// @flow

import styled from "styled-components";
import Text from "~/renderer/components/Text";
import { focusedShadowStyle } from "~/renderer/components/Box/Tabbable";
import Box from "~/renderer/components/Box";
import React from "react";
import ChevronRight from "~/renderer/icons/ChevronRight";
import { Flex } from "@ledgerhq/react-ui";

const TitleText = styled(Text).attrs(() => ({
  fontSize: 4,
  fontWeight: "semiBold",
  mb: "2px",
}))``;

const BodyText = styled(Text).attrs(p => ({
  fontSize: 4,
  fontWeight: "medium",
  color: p.theme.colors.neutral.c70,
  textAlign: "left",
}))``;

const EntryButtonContainer = styled.button`
  cursor: pointer;
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border: none;
  background-color: ${p => p.theme.colors.palette.background.paper};
  color: ${p => p.theme.colors.neutral.c100};
  border-radius: 4px;
  padding: ${p => p.theme.space[3]}px;
  gap: ${p => p.theme.space[3]}px;

  &:disabled {
    cursor: not-allowed;
    background-color: ${p => p.theme.colors.neutral.c30};
    color: ${p => p.theme.colors.neutral.c50};

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

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 100%;
  margin-right: ${p => p.theme.space[3]}px;
  background-color: ${p =>
    p.theme.colors.palette.type === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.02)"};}
`;

const EntryButton = ({
  title,
  body,
  onClick,
  disabled,
  Icon,
  showChevron,
}: {
  title: string,
  body: string,
  onClick: () => void,
  disabled?: boolean,
  Icon?: React$ComponentType<*>,
  showChevron?: boolean,
}) => {
  return (
    <EntryButtonContainer onClick={onClick} disabled={disabled}>
      <Flex flexShrink="initial">
        {Icon ? (
          <IconWrapper>
            <Icon />
          </IconWrapper>
        ) : null}
        <Box shrink style={{ alignItems: "flex-start" }}>
          <TitleText>{title}</TitleText>
          <BodyText>{body}</BodyText>
        </Box>
      </Flex>
      {showChevron ? <ChevronRight size={11} /> : null}
    </EntryButtonContainer>
  );
};

export default EntryButton;
