import React, { memo } from "react";
import { Tile, TileContent, TileTitle, TileDescription, Box } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import {
  getFearAndGreedColorKey,
  getFearAndGreedTranslationKey,
} from "@ledgerhq/live-common/cmc-client/utils/fearAndGreed";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import FearAndGreedArc from "../FearAndGreedArc";
import type { FearAndGreedCardProps } from "../FearAndGreedCard/types";

const ARC_SCALE = 2;

function FearAndGreedExpandedCard({ data, onPress }: FearAndGreedCardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { value } = data;
  const colorKey = getFearAndGreedColorKey(value);
  const translationKey = getFearAndGreedTranslationKey(value);

  return (
    <Tile
      appearance="card"
      lx={{ flex: 1, justifyContent: "center", gap: "s16" }}
      onPress={onPress}
      testID="fear-and-greed-expanded-card"
    >
      <Box lx={{ alignItems: "center", justifyContent: "center" }}>
        <FearAndGreedArc value={value} scale={ARC_SCALE} />
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

export default memo(FearAndGreedExpandedCard);
