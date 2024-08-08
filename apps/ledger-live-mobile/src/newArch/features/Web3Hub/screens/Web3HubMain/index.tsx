import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { MainProps } from "LLM/features/Web3Hub/types";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";
import { MAIN_BUTTON_BOTTOM, MAIN_BUTTON_SIZE } from "~/components/TabBar/shared";
import { ANIMATION_HEIGHT, TOTAL_HEADER_HEIGHT } from "./components/Header";

const PADDING_BOTTOM = MAIN_BUTTON_SIZE + MAIN_BUTTON_BOTTOM;

const clamp = (value: number, lowerBound: number, upperBound: number) => {
  "worklet";
  return Math.min(Math.max(lowerBound, value), upperBound);
};

export default function Web3HubMain({ navigation }: MainProps) {
  const { t } = useTranslation();
  const { layoutY } = useContext(HeaderContext);

  const scrollHandler = useAnimatedScrollHandler<{ prevY: number; prevLayoutY: number }>({
    onScroll: (event, ctx) => {
      if (!layoutY) return;

      const diff = event.contentOffset.y - ctx.prevY;

      layoutY.value = clamp(ctx.prevLayoutY + diff, 0, ANIMATION_HEIGHT);
    },
    onBeginDrag: (event, ctx) => {
      if (layoutY) {
        ctx.prevLayoutY = layoutY.value;
      }
      ctx.prevY = event.contentOffset.y;
    },
  });

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <ManifestsList
        title={t("web3hub.main.manifestsList.title")}
        navigation={navigation}
        onScroll={scrollHandler}
        pt={TOTAL_HEADER_HEIGHT}
        // Using this padding to keep the view visible under the tab button
        pb={PADDING_BOTTOM}
      />
    </View>
  );
}
