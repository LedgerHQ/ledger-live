import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "@shared/i18n";
import type { CardNumbersViewProps } from "../../types";

const FLIP_TRANSITION = {
  transitionProperty: "transform",
  transitionDuration: 500,
  transitionTimingFunction: "ease-in-out",
} as const;

export function CardNumbersView({
  status,
  imageUrl,
  onImageError,
  cardFace,
}: CardNumbersViewProps) {
  const isRevealed = status === "revealed" && Boolean(imageUrl);
  const details = imageUrl ? (
    <DetailsImage imageUrl={imageUrl} onImageError={onImageError} />
  ) : null;

  if (cardFace) {
    return (
      <View testID="card-numbers">
        <FlipCard isRevealed={isRevealed} cardFace={cardFace}>
          {details}
        </FlipCard>
      </View>
    );
  }

  return <View testID="card-numbers">{isRevealed ? details : null}</View>;
}

function FlipCard({
  isRevealed,
  cardFace,
  children,
}: {
  readonly isRevealed: boolean;
  readonly cardFace: React.ReactNode;
  readonly children: React.ReactNode;
}) {
  return (
    <View>
      <Animated.View
        accessibilityElementsHidden={isRevealed}
        importantForAccessibility={isRevealed ? "no-hide-descendants" : "auto"}
        style={{
          ...FLIP_TRANSITION,
          backfaceVisibility: "hidden",
          transform: [{ perspective: 1000 }, { rotateY: isRevealed ? "-180deg" : "0deg" }],
        }}
      >
        {cardFace}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden={!isRevealed}
        importantForAccessibility={!isRevealed ? "no-hide-descendants" : "auto"}
        style={[
          styles.back,
          {
            ...FLIP_TRANSITION,
            backfaceVisibility: "hidden",
            transform: [{ perspective: 1000 }, { rotateY: isRevealed ? "0deg" : "180deg" }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

function DetailsImage({
  imageUrl,
  onImageError,
}: {
  readonly imageUrl: string;
  readonly onImageError: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Image
      source={{ uri: imageUrl }}
      accessibilityLabel={t("payTab.card.numbers.imageAlt")}
      resizeMode="cover"
      onError={onImageError}
      style={styles.image}
    />
  );
}

const styles = StyleSheet.create({
  back: { ...StyleSheet.absoluteFillObject },
  image: { ...StyleSheet.absoluteFillObject },
});
