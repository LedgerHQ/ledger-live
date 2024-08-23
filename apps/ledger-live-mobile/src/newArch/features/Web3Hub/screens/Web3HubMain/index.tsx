import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MainProps } from "LLM/features/Web3Hub/types";
import useScrollHandler from "LLM/features/Web3Hub/hooks/useScrollHandler";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";
import { MAIN_BUTTON_BOTTOM, MAIN_BUTTON_SIZE } from "~/components/TabBar/shared";
import Header, { ANIMATION_HEIGHT, TOTAL_HEADER_HEIGHT } from "./components/Header";
import ManifestsCategoryList from "./components/ManifestsCategoryList";
import { TrackScreen } from "~/analytics";

const PADDING_BOTTOM = MAIN_BUTTON_SIZE + MAIN_BUTTON_BOTTOM;

const edges = ["top", "bottom", "left", "right"] as const;

export default function Web3HubMain({ navigation }: MainProps) {
  const { t } = useTranslation();
  const { layoutY, scrollHandler } = useScrollHandler(ANIMATION_HEIGHT);

  return (
    <SafeAreaView edges={edges} style={{ flex: 1 }}>
      <TrackScreen category="Web3Hub" name="Web3HubMainPage" />
      <Header title={t("web3hub.main.header.title")} navigation={navigation} layoutY={layoutY} />

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
          headerComponent={
            <ManifestsCategoryList
              title={t(`web3hub.main.clearSigning.title`, {
                defaultValue: "clear Signing",
              })}
              navigation={navigation}
              categoryId={"clear signing"}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}
