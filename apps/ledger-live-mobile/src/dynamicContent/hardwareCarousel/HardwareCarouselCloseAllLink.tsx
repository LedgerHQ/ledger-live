import React from "react";
import { Link } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { useHardwareCarouselCloseAll } from "./useHardwareCarouselCloseAll";

type Props = Readonly<{
  cardIds: readonly string[];
}>;

export function HardwareCarouselCloseAllLink({ cardIds }: Props) {
  const { t } = useTranslation();
  const handleCloseAll = useHardwareCarouselCloseAll(cardIds);

  return (
    <Link
      appearance="base"
      onPress={handleCloseAll}
      size="sm"
      testID="hardware-carousel-close-all"
      underline={false}
    >
      {t("portfolio.carousel.closeAll")}
    </Link>
  );
}
