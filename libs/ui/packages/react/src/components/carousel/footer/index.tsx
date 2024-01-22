import { ArrowLeft, ArrowRight } from "@ledgerhq/icons-ui/react";
import { UseEmblaCarouselType } from "embla-carousel-react";
import React from "react";
import styled from "styled-components";
import Pagination from "./pagination";

type Props = {
  slides: {
    id: number | string;
    Component: () => React.JSX.Element;
  }[];
};

const FooterContainer = styled.div`
  padding: 6px 16px 6px 16px;
  border-top: 1px solid ${p => p.theme.colors.constant.white};
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

const Footer = ({
  slides,
  emblaApi,
  index,
}: Props & { emblaApi: UseEmblaCarouselType[1]; index: number }) => {
  return (
    <FooterContainer>
      <Pagination slides={slides} emblaApi={emblaApi} index={index} />

      <FooterArrowsContainer>
        <FooterArrowContainer onClick={() => emblaApi?.scrollPrev()}>
          <ArrowLeft size="S" />
        </FooterArrowContainer>
        <FooterArrowContainer onClick={() => emblaApi?.scrollNext()}>
          <ArrowRight size="S" />
        </FooterArrowContainer>
      </FooterArrowsContainer>
    </FooterContainer>
  );
};

export default Footer;
