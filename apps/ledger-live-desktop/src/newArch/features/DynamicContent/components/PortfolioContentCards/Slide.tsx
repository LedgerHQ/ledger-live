import React, { memo } from "react";
import { useHistory } from "react-router-dom";

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
  logSlideClick,
  dismissCard,
}: Props) {
  const history = useHistory();

  const handleClose = () => dismissCard(index);
  const handleClick = () => {
    logSlideClick(id);

    if (path) {
      history.push({ pathname: path, state: { source: "banner" } });
    } else if (url) {
      openURL(url);
    }
  };

  return (
    <LogContentCardWrapper id={id}>
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
