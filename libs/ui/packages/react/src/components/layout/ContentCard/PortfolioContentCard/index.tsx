import React, { type ReactEventHandler } from "react";
import styled from "styled-components";

import { StyleProvider } from "../../../../styles";
import { Icons } from "../../../../assets";
import { Text } from "../../../asorted";
import { Button } from "../../../cta";
import Tag from "../../../Tag";

export type PortfolioContentCardProps = {
  title: string;
  cta?: string;
  description?: string;
  tag?: string;
  image?: string;

  onClick: ReactEventHandler;
  onClose: ReactEventHandler;
};

export default function PortfolioContentCard({
  title,
  cta,
  description,
  tag,
  image,
  onClick,
  onClose,
}: PortfolioContentCardProps) {
  const handleClose: ReactEventHandler = event => {
    event.stopPropagation();
    onClose(event);
  };

  return (
    <Wrapper image={image} tag={tag} onClick={onClick}>
      {tag && <StyledTag>{tag}</StyledTag>}
      <Title>{title}</Title>
      {description && <Desc>{description}</Desc>}
      {cta && (
        <Button variant="main" outline={false} onClick={onClick}>
          {cta}
        </Button>
      )}
      <StyleProvider selectedPalette="dark">
        <CloseButton onClick={handleClose} />
      </StyleProvider>
    </Wrapper>
  );
}

const StyledTag = styled(Tag).attrs({ size: "medium", type: "plain", active: true })`
  font-size: 11px;
  background-color: ${p => p.theme.colors.primary.c80};
`;

const Title = styled(Text).attrs({ variant: "h4Inter" })`
  font-family: Inter;
  font-size: 24px;
  font-weight: 600;
`;

const Desc = styled(Text).attrs({ variant: "small", color: "neutral.c70" })`
  font-family: Inter;
  font-size: 13px;
  font-style: normal;
  font-weight: 500;
  padding-bottom: 8px;
`;

const Wrapper = styled.div<Pick<PortfolioContentCardProps, "image" | "tag" | "onClick">>`
  background-color: ${p => p.theme.colors.background.card};
  background-image: ${p => (p.image ? `url("${p.image}")` : "none")};
  background-position: right center;
  background-repeat: no-repeat;
  background-size: 50% auto;

  cursor: pointer;
  padding: 16px;
  padding-top: ${p => (p.tag ? "16px" : "24px")};
  padding-right: 50%;

  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 4px;
`;

const CloseButton = styled(Button).attrs({
  Icon: <Icons.Close size="XS" />,
  iconButton: true,
  outline: true,
})`
  background-color: ${p => p.theme.colors.neutral.c30};
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  svg {
    width: 12px;
    height: 12px;
  }
`;
