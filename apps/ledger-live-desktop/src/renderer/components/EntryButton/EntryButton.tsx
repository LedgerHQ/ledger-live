import styled from "styled-components";
import { focusedShadowStyle } from "~/renderer/components/Box/Tabbable";
import Box from "~/renderer/components/Box";
import React from "react";
import ChevronRight from "~/renderer/icons/ChevronRight";
import { Tag, Text } from "@ledgerhq/react-ui";

const TitleText = styled(Text).attrs(() => ({
  variant: "body",
  fontSize: 4,
  fontWeight: "semiBold",
  mb: "2px",
}))`
  transition: color ease-in-out 200ms;
`;

const BodyText = styled(Text).attrs(p => ({
  variant: "paragraph",
  fontSize: 4,
  fontWeight: "medium",
  color: p.theme.colors.neutral.c70,
}))`
  transition: color ease-in-out 200ms;
`;

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
  transition: ease-in-out 200ms;

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
  background-color: ${p => p.theme.colors.palette.neutral.c100a005};
`;

interface EntryButtonProps {
  title: string;
  body: string;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  Icon?: React.ComponentType;
  showChevron?: boolean;
  entryButtonTestId?: string;
}
const EntryButton: React.FC<EntryButtonProps> = ({
  title,
  body,
  onClick,
  disabled,
  Icon,
  label,
  showChevron,
  entryButtonTestId,
}) => {
  return (
    <EntryButtonContainer onClick={onClick} disabled={disabled} data-test-id={entryButtonTestId}>
      <Box horizontal shrink alignItems="center">
        {Icon && (
          <IconWrapper>
            <Icon />
          </IconWrapper>
        )}
        <Box shrink alignItems="flex-start">
          <TitleText>
            {title}
            {label && (
              <Text ml={1} fontSize={2}>
                <Tag active mx={1} type="plain" size="small">
                  {label}
                </Tag>
              </Text>
            )}
          </TitleText>
          <BodyText>{body}</BodyText>
        </Box>
      </Box>
      {showChevron && <ChevronRight size={11} />}
    </EntryButtonContainer>
  );
};

export default EntryButton;
