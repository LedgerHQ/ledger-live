import React from "react";
import styled from "styled-components";
import { SubProps } from "../../types";
import Bullet from "./bullets";
import { getItemStatus } from "./utils";

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
