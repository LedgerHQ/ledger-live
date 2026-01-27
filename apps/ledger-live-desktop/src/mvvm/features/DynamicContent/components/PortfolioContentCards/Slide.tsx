import React, { memo } from "react";
import { useNavigate } from "react-router";

import { PortfolioContentCard as Card } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../../types";
import LogContentCardWrapper from "../LogContentCardWrapper";

export default memo(Slide);

type Props = PortfolioContentCard & CarouselActions & { index: number };

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
  );
}
