import React from "react";
import { INITIAL_CARDS } from "./__mocks__/reviews";
import { ExampleCard } from "./cards/ExampleCard";
import { SwiperComponent } from "LLM/components/Swiper/components/Swiper";

export default function SwiperScreenDebug() {
  return (
    <SwiperComponent
      initialCards={INITIAL_CARDS.map((card, index) => ({ ...card, idCard: index + 1 }))}
      renderCard={card => <ExampleCard card={card} />}
      currentIndex={0}
      onIndexChange={index => console.log("Current index changed to:", index)}
    />
  );
}
