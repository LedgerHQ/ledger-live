import React, { memo } from "react";
import { useNavigate } from "react-router";
import styled from "styled-components";

import { PortfolioContentCard as Card } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../../types";
import LogContentCardWrapper from "../LogContentCardWrapper";

export default memo(Slide);

const SlideContainer = styled.div`
  border-radius: 12px;
  overflow: hidden;
`;

type Props = PortfolioContentCard &
  CarouselActions & {
    /** Index into `portfolioCards` for dismiss. */
    index: number;
    /** Visual carousel position for analytics (may include a leading upsell offset). */
    displayedPosition?: number;
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
  displayedPosition,
  location,
  logSlideClick,
  dismissCard,
}: Props) {
  const navigate = useNavigate();
  const analyticsPosition = displayedPosition ?? index;

  const handleClose = () => dismissCard(index, analyticsPosition);
  const handleClick = () => {
    logSlideClick(id, analyticsPosition);
    if (path) {
      navigate(path, { state: { source: "banner" } });
    } else if (url) {
      openURL(url);
    }
  };

  return (
    <SlideContainer>
      <LogContentCardWrapper id={id} displayedPosition={analyticsPosition} location={location}>
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
