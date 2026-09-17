import React from "react";
import { Image, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { CARD_FACE_BORDER, CARD_GRADIENT_END } from "../CardArtwork/cardColors";
import type { CardFlipProps } from "../../types";

const FLIP_TRANSITION = {
  transitionProperty: "transform",
  transitionDuration: 500,
  transitionTimingFunction: "ease-in-out",
} as const;

export function CardFlip({ reveal, cardFace }: CardFlipProps) {
  if (!reveal) {
    return <>{cardFace}</>;
  }

  const { isRevealed, imageUrl, onImageLoad, onImageError } = reveal;
  const details = imageUrl ? (
    <DetailsImage imageUrl={imageUrl} onImageLoad={onImageLoad} onImageError={onImageError} />
  ) : null;

  return (
    <Box testID="card-flip" style={styles.card}>
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
        {details}
      </Animated.View>
    </Box>
  );
}

function DetailsImage({
  imageUrl,
  onImageLoad,
  onImageError,
}: {
  readonly imageUrl: string;
  readonly onImageLoad: (loadedUrl?: string) => void;
  readonly onImageError: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{ padding: "s1", borderRadius: "lg", borderWidth: "s1" }}
      style={[
        styles.imageFrame,
        { backgroundColor: CARD_GRADIENT_END, borderColor: CARD_FACE_BORDER },
      ]}
    >
      <Image
        source={{ uri: imageUrl, cache: "reload" }}
        accessibilityLabel={t("payTab.card.numbers.imageAlt")}
        resizeMode="contain"
        onLoad={() => onImageLoad(imageUrl)}
        onError={onImageError}
        style={styles.image}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  card: { width: "100%" },
  back: { ...StyleSheet.absoluteFillObject },
  imageFrame: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
});
