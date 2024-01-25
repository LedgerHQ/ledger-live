import { UseEmblaCarouselType } from "embla-carousel-react";
import React from "react";
import styled from "styled-components";
import { Props } from "../types";
import Pagination from "./Pagination";

const FooterContainer = styled.div`
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FooterDefault = ({
  slides,
  emblaApi,
  index,
}: Props & { emblaApi: UseEmblaCarouselType[1]; index: number }) => {
  return (
    <FooterContainer>
      <Pagination slides={slides} emblaApi={emblaApi} index={index} />
    </FooterContainer>
  );
};

export default FooterDefault;
