import React, { memo } from "react";
import { Tile, TileContent, TileTitle, TileDescription, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import {
  getFearAndGreedColorKey,
  getFearAndGreedTranslationKey,
} from "@ledgerhq/live-common/cmc-client/utils/fearAndGreed";
import FearAndGreedArc from "../FearAndGreedArc";
import type { FearAndGreedCardProps } from "./types";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

function FearAndGreedCard({ data, onPress }: FearAndGreedCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { value } = data;
  const colorKey = getFearAndGreedColorKey(value);
  const translationKey = getFearAndGreedTranslationKey(value);

  return (
    <Tile
      appearance="card"
      lx={{ width: "s96", flexGrow: 1 }}
      onPress={onPress}
      testID="fear-and-greed-card"
    >
      <Box lx={{ height: "s40", justifyContent: "center", alignItems: "center" }}>
        <FearAndGreedArc value={value} />
      </Box>
      <TileContent>
        <TileTitle>{t("fearAndGreed.tileTitle")}</TileTitle>
        <TileDescription
          style={{
            // will be fixed with the new folder structure
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            color: theme.colors.text[colorKey as keyof typeof theme.colors.text],
          }}
        >
          {t(translationKey)}
        </TileDescription>
      </TileContent>
    </Tile>
  );
}

export default memo(FearAndGreedCard);
