import { Icons } from "@ledgerhq/react-ui";
import { UseEmblaCarouselType } from "embla-carousel-react";
import React from "react";
import styled from "styled-components";
import Bullet from "./bullets";
import { getItemStatus } from "~/renderer/components/NewCarousel/footer/utils";

type Props = {
  slides: {
    id: number | string;
    Component: () => React.JSX.Element;
  }[];
};

const FooterContainer = styled.div`
  padding: 6px 16px 6px 16px;
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
  display: flex;
  justify-content: space-between;
`;

const FooterArrowsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const FooterArrowContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const Bullets = {
  Active: styled.div`
    width: 16px;
    height: 6px;
    background-color: ${p => p.theme.colors.opacityDefault.c80};
    border-radius: 100px;
  `,
  OneSwipe: styled.div`
    width: 8px;
    height: 6px;
    background-color: ${p => p.theme.colors.opacityDefault.c30};
    border-radius: 100px;
  `,
  TwoSwipe: styled.div`
    width: 4px;
    height: 6px;
    background-color: ${p => p.theme.colors.opacityDefault.c10};
    border-radius: 100px;
  `,
  Far: styled.div`
    width: 1px;
    height: 6px;
    background-color: transparent;
    border-radius: 100px;
  `,
};

const FooterCarouselBullets = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const Pagination = ({
  slides,
  emblaApi,
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
