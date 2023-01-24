// @flow

import styled from "styled-components";
import Text from "~/renderer/components/Text";
import { focusedShadowStyle } from "~/renderer/components/Box/Tabbable";
import Box from "~/renderer/components/Box";
import React from "react";
import ChevronRight from "~/renderer/icons/ChevronRight";

const TitleText = styled(Text).attrs(() => ({
  fontSize: 4,
  fontWeight: "semiBold",
  mb: "2px",
}))``;

const BodyText = styled(Text).attrs(p => ({
  fontSize: 4,
  fontWeight: "medium",
  color: p.theme.colors.neutral.c70,
}))``;

const EntryButtonContainer = styled.button`
  cursor: pointer;
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  text-align: left;
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

const LabelWrapper = styled(Box).attrs(() => ({
  fontSize: 2,
  fontWeight: "bold",
  px: "6px",
  py: "3px",
  ml: 1,
  backgroundColor: "primary.c90",
  color: "neutral.c00",
  borderRadius: 1,
  translateY: "3px",
  position: "relative",
  top: "-1px",
}))`
  display: inline;
`;

const Label = ({ label }: { label: string }) => {
  return <LabelWrapper>{label}</LabelWrapper>;
};

const EntryButton = ({
  title,
  body,
  onClick,
  disabled,
  Icon,
  label,
  showChevron,
}: {
  title: string,
  body: string,
  onClick: () => void,
  disabled?: boolean,
  label?: string,
  Icon?: React$ComponentType<*>,
  showChevron?: boolean,
}) => {
  return (
    <EntryButtonContainer onClick={onClick} disabled={disabled}>
      <Box horizontal shrink alignItems="center">
        {Icon ? (
          <IconWrapper>
            <Icon />
          </IconWrapper>
        ) : null}
        <Box shrink alignItems="flex-start">
          <TitleText>
            {title} {label ? <Label label={label} /> : null}
          </TitleText>
          <BodyText>{body}</BodyText>
        </Box>
      </Box>
      {showChevron ? <ChevronRight size={11} /> : null}
    </EntryButtonContainer>
  );
};

export default EntryButton;
