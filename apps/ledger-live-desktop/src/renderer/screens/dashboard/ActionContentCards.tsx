import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { Carousel } from "@ledgerhq/react-ui";
import { ABTestingVariants } from "@ledgerhq/types-live";
import React, { PropsWithChildren, useMemo } from "react";
import styled from "styled-components";
import { useRefreshAccountsOrderingEffect } from "~/renderer/actions/general";
import { Card } from "~/renderer/components/Box";
import useActionCards from "~/renderer/hooks/useActionCards";
import ActionCard from "~/renderer/components/ContentCards/ActionCard";
import { ContentBannerActionCard } from "LLD/features/DynamicContent/components/ContentBannerActionCard";
import LogContentCardWrapper from "LLD/features/DynamicContent/components/LogContentCardWrapper";

// Classic variants (carousel with background)
const ActionVariantA = styled(Card)`
  background-color: ${p => p.theme.colors.opacityPurple.c10};
`;

const ActionVariantBContainer = styled.div`
  position: relative;
  margin-left: 24px;
  margin-right: 24px;
`;

const ActionVariantBWrapper = styled.div`
  position: absolute;
  width: 100%;
  bottom: 30px;
  zindex: 10000;
  backdrop-filter: blur(15px);
  border-radius: 8px;
  background-color: ${p => p.theme.colors.opacityPurple.c10};
`;

const ActionVariantB = ({ children }: PropsWithChildren) => (
  <ActionVariantBContainer>
    <ActionVariantBWrapper>{children}</ActionVariantBWrapper>
  </ActionVariantBContainer>
);

/** 2 columns, max 2 cards */
const BrazePlacementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
  & > * {
    min-width: 0;
  }
`;

const ActionContentCards = ({ variant }: { variant: ABTestingVariants }) => {
  const { actionCards, onClick, onDismiss } = useActionCards();
  const lldActionCarousel = useFeature("lldActionCarousel");
  const { shouldDisplayBrazePlacement } = useWalletFeaturesConfig("desktop");
  const additionalProps = useMemo(() => ({ variant }), [variant]);

  const brazeCards = shouldDisplayBrazePlacement ? actionCards.slice(0, 2) : [];
  const brazeSlides = brazeCards.map((slide, index) => (
    <LogContentCardWrapper
      key={slide.id}
      id={slide.id}
      additionalProps={additionalProps}
      displayedPosition={index}
      location={slide.location}
    >
      <ContentBannerActionCard
        title={slide.title}
        description={slide.description}
        onClose={() => onDismiss(slide.id, index)}
        onClick={() => onClick(slide.id, slide.link, index)}
        icon={slide.icon}
        image_background={slide.image_background}
      />
    </LogContentCardWrapper>
  ));

  // Classic carousel: all cards
  const classicSlides = actionCards.map((slide, index) => (
    <LogContentCardWrapper
      key={slide.id}
      id={slide.id}
      additionalProps={additionalProps}
      displayedPosition={index}
      location={slide.location}
    >
      <ActionCard
        img={slide.image}
        title={slide.title}
        description={slide.description}
        actions={{
          primary: {
            label: slide.mainCta,
            action: () => onClick(slide.id, slide.link, index),
          },
          dismiss: {
            label: slide.secondaryCta,
            action: () => onDismiss(slide.id, index),
          },
        }}
      />
    </LogContentCardWrapper>
  ));

  useRefreshAccountsOrderingEffect({
    onMount: true,
  });

  // grid 2 cols, max 2 cards
  if (shouldDisplayBrazePlacement && lldActionCarousel?.enabled && brazeSlides.length > 0) {
    return <BrazePlacementGrid>{brazeSlides}</BrazePlacementGrid>;
  }

  if (!lldActionCarousel?.enabled || classicSlides.length === 0) return null;

  if (
    lldActionCarousel?.params?.variant === ABTestingVariants.variantB &&
    variant === ABTestingVariants.variantB
  ) {
    return (
      <ActionVariantB>
        <Carousel variant="content-card">{classicSlides}</Carousel>
      </ActionVariantB>
    );
  } else if (
    lldActionCarousel?.params?.variant !== ABTestingVariants.variantB &&
    variant === ABTestingVariants.variantA
  ) {
    return (
      <ActionVariantA>
        <Carousel variant="content-card">{classicSlides}</Carousel>
      </ActionVariantA>
    );
  }

  return null;
};

export default ActionContentCards;
