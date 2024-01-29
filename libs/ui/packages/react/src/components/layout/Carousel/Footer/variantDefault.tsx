import React from "react";
import styled from "styled-components";
import Pagination from "./Pagination";
import { SubProps } from "../types";

const FooterContainer = styled.div`
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FooterDefault = (props: SubProps) => {
  return (
    <FooterContainer>
      <Pagination {...props} />
    </FooterContainer>
  );
};

export default FooterDefault;
