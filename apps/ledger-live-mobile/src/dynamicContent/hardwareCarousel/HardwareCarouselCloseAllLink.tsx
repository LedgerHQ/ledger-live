import React from "react";
import { Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { useHardwareCarouselCloseAll } from "./useHardwareCarouselCloseAll";

type Props = Readonly<{
  cardIds: readonly string[];
}>;

export function HardwareCarouselCloseAllLink({ cardIds }: Props) {
  const { t } = useTranslation();
  const handleCloseAll = useHardwareCarouselCloseAll(cardIds);

  return (
    <Pressable onPress={handleCloseAll} testID="hardware-carousel-close-all">
      <Text typography="body2SemiBold" lx={{ color: "muted" }}>
        {t("portfolio.carousel.closeAll")}
      </Text>
    </Pressable>
  );
}
