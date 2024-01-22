import { UseEmblaCarouselType } from "embla-carousel-react";
import React from "react";
import styled from "styled-components";
import { getItemStatus } from "~/renderer/components/NewCarousel/footer/utils";
import Bullet from "./bullets";
import { ItemStatus } from "~/renderer/components/NewCarousel/footer/pagination/types";

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
  emblaApi,
  index: carouselIndex,
}: Props & { emblaApi: UseEmblaCarouselType[1]; index: number }) => {
  return (
    <FooterCarouselBullets>
      {slides.map((item, index) => {
        const isBulletVisible = getItemStatus(index, carouselIndex) !== ItemStatus.none;

        return (
          <>
            <Bullet key={item.id} type={getItemStatus(index, carouselIndex)} />
            {isBulletVisible && <div style={{ width: "4px" }} />}
          </>
        );
      })}
    </FooterCarouselBullets>
  );
};

export default Pagination;
