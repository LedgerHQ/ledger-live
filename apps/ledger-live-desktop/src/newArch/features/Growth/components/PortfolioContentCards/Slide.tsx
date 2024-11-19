import React, { memo } from "react";
import { useHistory } from "react-router-dom";

import { PortfolioContentCard as Card } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../../types";

export default memo(Slide);

type Props = PortfolioContentCard &
  Pick<CarouselActions, "logSlideClick" | "dismissCard"> & { index: number };

function Slide({ logSlideClick, dismissCard, index, ...card }: Props) {
  const history = useHistory();

  const handleClose = () => dismissCard(index);
  const handleClick = () => {
    logSlideClick(card.id);

    if (card.path) {
      history.push({ pathname: card.path, state: { source: "banner" } });
    } else if (card.url) {
      openURL(card.url);
    }
  };

  return (
    <Card
      title={card.title}
      cta={card.cta}
      description={card.description}
      tag={card.tag}
      image={card.image}
      onClick={handleClick}
      onClose={handleClose}
    />
  );
}
