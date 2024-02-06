import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Carousel } from "@ledgerhq/react-ui";
import { ABTestingVariants } from "@ledgerhq/types-live";
import React, { PropsWithChildren } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useRefreshAccountsOrderingEffect } from "~/renderer/actions/general";
import { Card } from "~/renderer/components/Box";
import usePortfolioCards from "~/renderer/hooks/usePortfolioCards";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { hasInstalledAppsSelector } from "~/renderer/reducers/settings";

const PortfolioVariantA = styled(Card)`
  background-color: ${p => p.theme.colors.opacityPurple.c10};
`;

const PortfolioVariantBContainer = styled.div`
  position: relative;
  margin-left: 24px;
  margin-right: 24px;
`;

const PortfolioVariantBWrapper = styled.div`
  position: absolute;
  width: 100%;
  bottom: 30px;
  zindex: 10000;
  backdrop-filter: blur(15px);
  border-radius: 8px;
  background-color: ${p => p.theme.colors.opacityPurple.c10};
`;

const PortfolioVariantB = ({ children }: PropsWithChildren) => (
  <PortfolioVariantBContainer>
    <PortfolioVariantBWrapper>{children}</PortfolioVariantBWrapper>
  </PortfolioVariantBContainer>
);

const PortfolioContentCards = ({ variant }: { variant: ABTestingVariants }) => {
  const slides = usePortfolioCards();
  const lldPortfolioCarousel = useFeature("lldPortfolioCarousel");
  const totalAccounts = useSelector(accountsSelector).length;
  const hasInstalledApps = useSelector(hasInstalledAppsSelector);

  const showCarousel = lldPortfolioCarousel?.enabled && hasInstalledApps && totalAccounts >= 0;
  useRefreshAccountsOrderingEffect({
    onMount: true,
  });

  if (!showCarousel || slides.length === 0) return null;
  if (
    lldPortfolioCarousel?.params?.variant === ABTestingVariants.variantA &&
    variant === ABTestingVariants.variantA
  )
    return (
      <PortfolioVariantA>
        <Carousel variant="content-card">{slides}</Carousel>
      </PortfolioVariantA>
    );

  if (
    lldPortfolioCarousel?.params?.variant === ABTestingVariants.variantB &&
    variant === ABTestingVariants.variantB
  )
    return (
      <PortfolioVariantB>
        <Carousel variant="content-card">{slides}</Carousel>
      </PortfolioVariantB>
    );

  return null;
};

export default PortfolioContentCards;
