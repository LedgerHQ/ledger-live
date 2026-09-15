import React, { useState } from "react";
import { Image, PixelRatio, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "@shared/i18n";
import type { CardNumbersViewProps } from "../../types";

const FLIP_TRANSITION = {
  transitionProperty: "transform",
  transitionDuration: 500,
  transitionTimingFunction: "ease-in-out",
} as const;

type PixelSize = Readonly<{ width: number; height: number }>;

export function CardNumbersView({
  status,
  imageUrl,
  onImageError,
  cardFace,
}: CardNumbersViewProps) {
  const [pixelSize, setPixelSize] = useState<PixelSize>();
  const isRevealed = status === "revealed" && Boolean(imageUrl);
  const details = imageUrl ? (
    <DetailsImage imageUrl={imageUrl} pixelSize={pixelSize} onImageError={onImageError} />
  ) : null;

  function onCardLayout({ nativeEvent }: LayoutChangeEvent) {
    const scale = PixelRatio.get();
    setPixelSize({
      width: Math.round(nativeEvent.layout.width * scale),
      height: Math.round(nativeEvent.layout.height * scale),
    });
  }

  if (cardFace) {
    return (
      <View testID="card-numbers">
        <FlipCard isRevealed={isRevealed} cardFace={cardFace} onLayout={onCardLayout}>
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
  onLayout,
}: {
  readonly isRevealed: boolean;
  readonly cardFace: React.ReactNode;
  readonly children: React.ReactNode;
  readonly onLayout: (event: LayoutChangeEvent) => void;
}) {
  return (
    <View onLayout={onLayout}>
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
  pixelSize,
  onImageError,
}: {
  readonly imageUrl: string;
  readonly pixelSize?: PixelSize;
  readonly onImageError: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Image
      source={{
        uri: imageUrl,
        cache: "force-cache",
        ...(pixelSize ?? {}),
      }}
      accessibilityLabel={t("payTab.card.numbers.imageAlt")}
      resizeMode="cover"
      resizeMethod="resize"
      onError={onImageError}
      style={styles.image}
    />
  );
}

const styles = StyleSheet.create({
  back: { ...StyleSheet.absoluteFillObject },
  image: { ...StyleSheet.absoluteFillObject },
});
