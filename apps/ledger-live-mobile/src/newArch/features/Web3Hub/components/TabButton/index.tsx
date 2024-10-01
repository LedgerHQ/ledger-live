import React, { useCallback } from "react";
import { useTheme } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { BorderlessButton } from "react-native-gesture-handler";
import type { AppProps, MainProps, SearchProps } from "LLM/features/Web3Hub/types";
import { NavigatorName, ScreenName } from "~/const";
import { captureScreen } from "react-native-view-shot";
import deviceStorage from "~/logic/storeWrapper";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";

type Props = {
  count: number;
  fromX?: boolean;
  manifest?: AppManifest;
  navigation: MainProps["navigation"] | SearchProps["navigation"] | AppProps["navigation"];
};

type;

export default function TabButton({ count, navigation, fromX = false, manifest }: Props) {
  const { colors } = useTheme();

  const captureTabPreview = useCallback(async () => {
    try {
      if (!manifest) throw Error("Manifest Absent");

      const uri = await captureScreen({
        format: "jpg",
        quality: 0.8,
      });

      let tabHistory = await deviceStorage.get("web3hubTabHistory");

      if (!tabHistory || Object.keys(tabHistory).length === 0) {
        tabHistory = [];
      }

      tabHistory = [
        ...tabHistory,
        {
          id: manifest.id + Math.ceil(Math.random() * 1000),
          manifestId: manifest.id,
          title: manifest.name,
          icon: manifest.icon?.trim(),
          previewUri: uri,
          url: manifest.url,
        },
      ];

      deviceStorage.save("web3hubTabHistory", tabHistory);
    } catch (error) {
      console.error("Failed to capture screen or save tab preview", error);
    }
  }, [manifest]);

  const goToTabs = useCallback(() => {
    if (!fromX) {
      captureTabPreview();
    }

    navigation.setParams({ presentation: "modal" });
    navigation.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubTabs,
      params: {
        merge: true,
      },
    });
  }, [navigation]);

  return (
    <BorderlessButton onPress={goToTabs} activeOpacity={0.5} borderless={false}>
      <View
        accessible
        accessibilityRole="button"
        style={[
          styles.container,
          {
            borderColor: colors.black,
          },
        ]}
      >
        <Text fontWeight="semiBold" variant="large" style={styles.count}>
          {count}
        </Text>
      </View>
    </BorderlessButton>
  );
}

const TOTAL_SIZE = 48;
const BORDER_WIDTH = 2;
const MARGIN = 12;
const SIZE = TOTAL_SIZE - MARGIN * 2;
const LINE_HEIGHT = SIZE - BORDER_WIDTH * 2;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: BORDER_WIDTH,
    margin: MARGIN,
    width: SIZE,
    height: SIZE,
    backgroundColor: "transparent",
  },
  count: {
    lineHeight: LINE_HEIGHT,
  },
});
