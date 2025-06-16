import React, { type ReactEventHandler } from "react";

import { Button } from "../../../cta";
import BannerCard from "../../Banner/BannerCard";

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
  return (
    <BannerCard
      title={title}
      cta={
        cta && (
          <Button variant="main" outline={false}>
            {cta}
          </Button>
        )
      }
      description={description}
      tag={tag}
      image={image}
      onClick={onClick}
      onClose={onClose}
    />
  );
}
