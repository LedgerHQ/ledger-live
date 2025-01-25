import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Carousel } from "@ledgerhq/react-ui";
import { ABTestingVariants } from "@ledgerhq/types-live";
import React, { PropsWithChildren, useMemo } from "react";
import styled from "styled-components";
import { useRefreshAccountsOrderingEffect } from "~/renderer/actions/general";
import { Card } from "~/renderer/components/Box";
import useActionCards from "~/renderer/hooks/useActionCards";
import ActionCard from "~/renderer/components/ContentCards/ActionCard";
import LogContentCardWrapper from "LLD/features/DynamicContent/components/LogContentCardWrapper";

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

const ActionContentCards = ({ variant }: { variant: ABTestingVariants }) => {
  const { actionCards, onClick, onDismiss } = useActionCards();
  const lldActionCarousel = useFeature("lldActionCarousel");
  const additionalProps = useMemo(() => ({ variant }), [variant]);

  const slides = actionCards.map(slide => (
    <LogContentCardWrapper key={slide.id} id={slide.id} additionalProps={additionalProps}>
      <ActionCard
        img={slide.image}
        title={slide.title}
        description={slide.description}
        actions={{
          primary: {
            label: slide.mainCta,
            action: () => onClick(slide.id, slide.link),
          },
          dismiss: {
            label: slide.secondaryCta,
            action: () => onDismiss(slide.id),
          },
        }}
      />
    </LogContentCardWrapper>
  ));

  useRefreshAccountsOrderingEffect({
    onMount: true,
  });

  if (!lldActionCarousel?.enabled || slides.length === 0) return null;

  if (
    lldActionCarousel?.params?.variant === ABTestingVariants.variantB &&
    variant === ABTestingVariants.variantB
  ) {
    return (
      <ActionVariantB>
        <Carousel variant="content-card">{slides}</Carousel>
      </ActionVariantB>
    );
  } else if (
    lldActionCarousel?.params?.variant !== ABTestingVariants.variantB &&
    variant === ABTestingVariants.variantA
  ) {
    return (
      <ActionVariantA>
        <Carousel variant="content-card">{slides}</Carousel>
      </ActionVariantA>
    );
  }

  return null;
};

export default ActionContentCards;
