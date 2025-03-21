import React from "react";
import styled from "styled-components";

const TopGradientBox = styled.div`
  width: 100%;
  height: 70px;
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(
    ${p => p.theme.colors.palette.background.paper} 40%,
    rgba(255, 255, 255, 0)
  );
  z-index: 2;
  pointer-events: none;
`;
const TopGradient = () => <TopGradientBox />;
export default TopGradient;
