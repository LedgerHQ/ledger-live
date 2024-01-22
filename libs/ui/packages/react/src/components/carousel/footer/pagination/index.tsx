import { UseEmblaCarouselType } from "embla-carousel-react";
import React from "react";
import styled from "styled-components";
import { getItemStatus } from "../utils";
import Bullet from "./bullets";

type Props = {
  slides: {
    id: number | string;
    Component: () => React.JSX.Element;
  }[];
};

const FooterCarouselBullets = styled.div`
  display: flex;
  align-items: center;
`;

const Pagination = ({
  slides,
  index: carouselIndex,
}: Props & { emblaApi: UseEmblaCarouselType[1]; index: number }) => {
  return (
    <FooterCarouselBullets>
      {slides.map((item, index) => (
        <Bullet key={item.id} type={getItemStatus(index, carouselIndex)} />
      ))}
    </FooterCarouselBullets>
  );
};

export default Pagination;
