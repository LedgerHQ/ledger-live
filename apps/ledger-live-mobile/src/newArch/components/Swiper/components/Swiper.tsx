import React from "react";

import { StyleSheet, View, Animated } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import { useSwiper } from "../hooks/useSwiper";
import { CardWithId, SwiperComponentProps } from "../types";
import SwipeableCard from "./SwipeableCard";

export function SwiperComponent<T extends CardWithId>({
  initialCards,
  renderCard,
  cardContainerStyle,
  containerStyle,
  currentIndex,
  onIndexChange,
}: SwiperComponentProps<T>) {
  const { cards, gesture, swipeX, swipeY } = useSwiper(initialCards, currentIndex, onIndexChange);

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.cardContainer, cardContainerStyle]}>
          {cards.map((card, index) => (
            <SwipeableCard key={card.idCard} index={index} swipeX={swipeX} swipeY={swipeY}>
              {renderCard(card)}
            </SwipeableCard>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
