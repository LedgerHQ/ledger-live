import { Carousel } from "@ledgerhq/react-ui";
import { ABTestingVariants } from "@ledgerhq/types-live";
import React from "react";
import styled from "styled-components";
import { useRefreshAccountsOrderingEffect } from "~/renderer/actions/general";
import { Card } from "~/renderer/components/Box";
import useActionCards from "~/renderer/hooks/useActionCards";
import ActionCard from "~/renderer/components/ContentCards/ActionCard";
import LogContentCardWrapper from "LLD/features/DynamicContent/components/LogContentCardWrapper";

const ActionCardsContainer = styled(Card)`
  background-color: ${p => p.theme.colors.opacityPurple.c10};
`;

const actionCardAnalyticsProps = { variant: ABTestingVariants.variantA };

const ActionContentCards = () => {
  const { actionCards, onClick, onDismiss } = useActionCards();

  useRefreshAccountsOrderingEffect({ onMount: true });

  const slides = actionCards.map((slide, index) => (
    <LogContentCardWrapper
      key={slide.id}
      id={slide.id}
      additionalProps={actionCardAnalyticsProps}
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
          ...(slide.secondaryCta
            ? {
                dismiss: {
                  label: slide.secondaryCta,
                  action: () => onDismiss(slide.id, index),
                },
              }
            : {}),
        }}
      />
    </LogContentCardWrapper>
  ));

  if (slides.length === 0) return null;

  return (
    <ActionCardsContainer>
      <Carousel variant="content-card">{slides}</Carousel>
    </ActionCardsContainer>
  );
};

export default ActionContentCards;
