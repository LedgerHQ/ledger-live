import React from "react";
import { useTheme } from "styled-components/native";
import { INITIAL_CARDS } from "./__mocks__/reviews";
import { ExampleCard } from "./cards/ExampleCard";
import { SwiperComponent } from "LLM/components/Swipper/components/Swiper";

export default function SwiperScreenDebug() {
  const { colors } = useTheme();
  return (
    <SwiperComponent
      initialCards={INITIAL_CARDS}
      renderCard={card => <ExampleCard card={card} />}
      containerStyle={{ backgroundColor: colors.opacityPurple.c50 }}
    />
  );
}
