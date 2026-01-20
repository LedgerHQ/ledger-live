import React, { memo } from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

function FearAndGreedTitle() {
  const { t } = useTranslation();

  return (
    <Text
      typography="heading2SemiBold"
      lx={{ color: "base", marginBottom: "s12" }}
      testID="fear-and-greed-title"
    >
      {t("fearAndGreed.title")}
    </Text>
  );
}

export default memo(FearAndGreedTitle);
