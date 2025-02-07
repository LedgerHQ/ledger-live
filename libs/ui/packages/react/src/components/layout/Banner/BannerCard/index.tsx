import React, { type ReactEventHandler, type ReactNode } from "react";
import styled from "styled-components";

import { StyleProvider } from "../../../../styles";
import { Icons } from "../../../../assets";
import { Text } from "../../../asorted";
import { Button, Link } from "../../../cta";
import Tag from "../../../Tag";
import type { FlexBoxProps } from "../../Flex";
import { Flex } from "../..";

export type BannerCardProps = FlexBoxProps & {
  title: string;
  cta?: string;
  linkText?: string;
  description?: ReactNode;
  descriptionWidth?: number;
  tag?: string;
  image?: string;

  onClick: ReactEventHandler;
  onLinkClick?: ReactEventHandler;
  onClose?: ReactEventHandler;
};

export default function BannerCard({
  title,
  cta,
  linkText,
  description,
  descriptionWidth,
  tag,
  image,
  onClick,
  onLinkClick,
  onClose,
  ...boxProps
}: BannerCardProps) {
  const handleClose: ReactEventHandler = event => {
    event.stopPropagation();
    onClose?.(event);
  };
  const handleCTAClick: ReactEventHandler = event => {
    event.stopPropagation();
    onClick(event);
  };
  const handleLinkClick: ReactEventHandler = event => {
    event.stopPropagation();
    onLinkClick?.(event);
  };

  return (
    <Wrapper {...boxProps} image={image} tag={tag} onClick={handleCTAClick}>
      {tag && <StyledTag>{tag}</StyledTag>}
      <Title>{title}</Title>
      {description && <Desc maxWidth={descriptionWidth}>{description}</Desc>}
      <Flex columnGap={5}>
        {cta && (
          <Button variant="main" outline={false} onClick={handleCTAClick}>
            {cta}
          </Button>
        )}
        {linkText && (
          <Link onClick={handleLinkClick}>
            <Text variant="body" fontSize={14} flexShrink={1}>
              {linkText}
            </Text>
          </Link>
        )}
      </Flex>
      {onClose && (
        <StyleProvider selectedPalette="dark">
          <CloseButton data-testid="portfolio-card-close-button" onClick={handleClose} />
        </StyleProvider>
      )}
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

const Wrapper = styled(Flex)<Pick<BannerCardProps, "image" | "tag">>`
  background-color: ${p => p.theme.colors.background.card};
  background-image: ${p => (p.image ? `url("${p.image}")` : "none")};
  background-position: right center;
  background-repeat: no-repeat;
  background-size: 50% auto;

  cursor: pointer;
  padding: 16px;
  padding-top: ${p => (p.tag ? "16px" : "24px")};
  padding-right: 50%;
  flex-basis: 100%;

  position: relative;
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
