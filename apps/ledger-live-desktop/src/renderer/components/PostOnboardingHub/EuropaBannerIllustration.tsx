import Illustration from "~/renderer/components/Illustration";
import bannerEuropa from "./assets/bannerEuropa.png";
import React from "react";
import styled from "styled-components";

const StyledIllustration = styled(Illustration)`
  border-radius: 15px;
`;

const EuropaBannerIllustration = () => (
  <StyledIllustration lightSource={bannerEuropa} darkSource={bannerEuropa} size={30} />
);
export default EuropaBannerIllustration;
