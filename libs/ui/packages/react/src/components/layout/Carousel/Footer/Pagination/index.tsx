import React from "react";
import { SubProps } from "src/components/layout/Carousel/types";
import styled from "styled-components";
import { getItemStatus } from "./utils";
import Bullet from "./bullets";

const FooterCarouselBullets = styled.div`
  display: flex;
  align-items: center;
`;

const Pagination = ({ children, currentIndex }: SubProps) => {
  return (
    <FooterCarouselBullets>
      {children.map((child, index) => (
        <Bullet key={child.key} type={getItemStatus(index, currentIndex)} />
      ))}
    </FooterCarouselBullets>
  );
};

export default Pagination;
