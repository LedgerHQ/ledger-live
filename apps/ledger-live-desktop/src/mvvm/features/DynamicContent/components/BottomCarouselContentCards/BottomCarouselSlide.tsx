import React, { memo } from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { MediaCard, MediaCardTitle, Tag } from "@ledgerhq/lumen-ui-react";

import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../../types";
import LogContentCardWrapper from "../LogContentCardWrapper";

import { useBottomCarouselSlideModel } from "./useBottomCarouselSlideModel";

export default memo(BottomCarouselSlide);

type Props = PortfolioContentCard &
  CarouselActions & {
    index: number;
  };

function BottomCarouselSlide({
  id,
  path,
  url,
  title,
  tag,
  picto,
  image,
  index,
  location,
  logSlideClick,
  dismissCard,
}: Props) {
  const { handleClick, handleClose, hasClickTarget, mediaHeader } = useBottomCarouselSlideModel({
    id,
    path,
    url,
    tag,
    picto,
    index,
    logSlideClick,
    dismissCard,
  });

  let header: React.ReactNode = null;
  if (mediaHeader?.kind === "picto") {
    header = (
      <CryptoIcon
        ledgerId={mediaHeader.ledgerId}
        ticker={mediaHeader.ledgerId}
        size={getValidCryptoIconSize(32)}
      />
    );
  } else if (mediaHeader?.kind === "tag") {
    header = <Tag label={mediaHeader.label} size="md" />;
  }

  return (
    <LogContentCardWrapper id={id} displayedPosition={index} location={location}>
      <MediaCard
        imageUrl={image ?? ""}
        onClick={hasClickTarget ? handleClick : undefined}
        onClose={handleClose}
      >
        {header}
        {title ? <MediaCardTitle>{title}</MediaCardTitle> : null}
      </MediaCard>
    </LogContentCardWrapper>
  );
}
