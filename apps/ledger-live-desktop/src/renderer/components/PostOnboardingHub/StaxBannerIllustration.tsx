import React from "react";
import Illustration from "~/renderer/components/Illustration";
import { Flex } from "@ledgerhq/react-ui";

import bannerStaxLight from "./assets/bannerStaxLight.svg";
import bannerStaxDark from "./assets/bannerStaxDark.svg";

const StaxBannerIllustration = () => (
  <Flex alignItems="center" justifyContent="center" bg="neutral.c100" borderRadius="100%" p={1}>
    <Illustration lightSource={bannerStaxLight} darkSource={bannerStaxDark} size={30} />
  </Flex>
);

export default StaxBannerIllustration;
