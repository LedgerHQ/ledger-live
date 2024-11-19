import React, { type ReactEventHandler } from "react";
import styled from "styled-components";

import { Icons } from "../../../../assets";
import { Text } from "../../../asorted";
import { Button } from "../../../cta";
import Tag from "../../../Tag";

export type PortfolioContentCardProps = {
  title: string;
  cta?: string;
  description: string;
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
      {tag && (
        <Tag size="medium" type="plain" active>
          {tag}
        </Tag>
      )}
      <Text variant="h4Inter">{title}</Text>
      <Text mb={3} variant="small" color="neutral.c70">
        {description}
      </Text>
      {cta && (
        <Button variant="main" outline={false} onClick={onClick}>
          {cta}
        </Button>
      )}
      <CloseButton onClick={handleClose} />
    </Wrapper>
  );
}

const Wrapper = styled.div<Pick<PortfolioContentCardProps, "image" | "tag" | "onClick">>`
  background-color: ${p => p.theme.colors.background.card};
  background-image: ${p => (p.image ? `url("${p.image}")` : "none")};
  background-position: right center;
  background-repeat: no-repeat;
  background-size: 50% auto;

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
