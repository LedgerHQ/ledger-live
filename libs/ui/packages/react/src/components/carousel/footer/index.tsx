import { UseEmblaCarouselType } from "embla-carousel-react";
import React, { FC } from "react";
import { Props, FooterVariant } from "../types";
import FooterContentCard from "./variant-content-card";
import FooterDefault from "./variant-default";

const Footers: {
  [key in FooterVariant]: FC<Props & { emblaApi: UseEmblaCarouselType[1]; index: number }>;
} = {
  "content-card": FooterContentCard,
  default: FooterDefault,
};

const Footer = ({
  slides,
  emblaApi,
  index,
  footerVariant = "default",
}: Props & { emblaApi: UseEmblaCarouselType[1]; index: number }) => {
  const Component = Footers[footerVariant];

  return <Component slides={slides} emblaApi={emblaApi} index={index} />;
};

export default Footer;
