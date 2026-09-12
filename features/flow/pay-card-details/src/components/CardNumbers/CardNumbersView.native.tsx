import React from "react";
import { Image, StyleSheet } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { isCardNumbersRevealed } from "./isCardNumbersRevealed";
import type { CardNumbersViewProps } from "../../types";

export function CardNumbersView({
  status,
  imageUrl,
  onImageError,
  cardFace,
}: CardNumbersViewProps) {
  return (
    <Box testID="card-numbers">
      {isCardNumbersRevealed(status, imageUrl) ? (
        <DetailsImage imageUrl={imageUrl} onError={onImageError} />
      ) : (
        cardFace
      )}
    </Box>
  );
}

function DetailsImage({
  imageUrl,
  onError,
}: {
  readonly imageUrl: string;
  readonly onError: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Box lx={detailsFrameLx} style={styles.frame}>
      <Image
        source={{ uri: imageUrl, cache: "reload" }}
        accessibilityLabel={t("payTab.card.numbers.imageAlt")}
        resizeMode="contain"
        onError={onError}
        style={styles.image}
      />
    </Box>
  );
}

const detailsFrameLx = {
  width: "full",
  justifyContent: "center",
  borderRadius: "lg",
  borderWidth: "s1",
  borderColor: "mutedSubtle",
  paddingLeft: "s16",
  paddingRight: "s16",
  backgroundColor: "base",
} as const;

const styles = StyleSheet.create({
  frame: { height: 195, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
});
