import React, { memo } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";

import { PortfolioContentCard as Card } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../../types";
import LogContentCardWrapper from "../LogContentCardWrapper";

export default memo(Slide);

const SlideContainer = styled.div<{ $isWallet40Enabled: boolean }>`
  ${({ $isWallet40Enabled }) =>
    $isWallet40Enabled &&
    `
    border-radius: 12px;
    overflow: hidden;
  `}
`;

type Props = PortfolioContentCard &
  CarouselActions & {
    index: number;
    isWallet40Enabled: boolean;
  };

function Slide({
  id,
  path,
  url,
  title,
  cta,
  description,
  tag,
  image,
  index,
  location,
  logSlideClick,
  dismissCard,
  isWallet40Enabled,
}: Props) {
  const navigate = useNavigate();

  const handleClose = () => dismissCard(index);
  const handleClick = () => {
    logSlideClick(id);
    if (path) {
      navigate(path, { state: { source: "banner" } });
    } else if (url) {
      openURL(url);
    }
  };

  return (
    <SlideContainer $isWallet40Enabled={isWallet40Enabled}>
      <LogContentCardWrapper id={id} location={location}>
        <Card
          title={title}
          cta={cta}
          description={description}
          tag={tag}
          image={image}
          onClick={handleClick}
          onClose={handleClose}
        />
      </LogContentCardWrapper>
    </SlideContainer>
  );
}
