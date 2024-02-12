import { ArrowLeft, ArrowRight } from "@ledgerhq/icons-ui/react";
import React from "react";
import styled from "styled-components";
import Pagination from "./Pagination";
import { SubProps } from "../types";

const FooterContainer = styled.div`
  height: 32px;
  border-top: 1px solid ${p => p.theme.colors.opacityDefault.c10};
  display: flex;
  justify-content: space-between;
  padding: 6px 16px 6px 16px;
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

const FooterContentCard = ({ children, emblaApi, currentIndex, variant }: SubProps) => {
  if (children.length === 1) return null;

  return (
    <FooterContainer>
      <Pagination
        variant={variant}
        children={children}
        emblaApi={emblaApi}
        currentIndex={currentIndex}
      />

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

export default FooterContentCard;
