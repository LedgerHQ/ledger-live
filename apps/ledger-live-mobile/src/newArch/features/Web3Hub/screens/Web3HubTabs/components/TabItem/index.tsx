import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import type { TabsProps } from "LLM/features/Web3Hub/types";
import React, { useCallback, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Theme } from "~/colors";
import { NavigatorName, ScreenName } from "~/const";

export type Web3HubTabType = {
  id: string;
  manifestId: string;
  icon: string | null | undefined;
  title: string;
  previewUri: string;
  url: string | URL;
};

export default function TabItem({
  item,
  onItemPress,
  extraData,
  navigation,
}: {
  item: Web3HubTabType;
  onItemPress: (itemId: string) => void;
  navigation: TabsProps["navigation"];
  extraData: { colors: Theme["colors"] };
}) {
  const [imageLoaded, setImageLoaded] = useState(true);
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageLoaded(false), []);
  const { colors } = extraData;

  const goToApp = useCallback(() => {
    navigation.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubApp,
      params: {
        manifestId: item?.manifestId,
      },
    });
  }, [navigation, item?.manifestId]);

  const handlePressClose = () => {
    onItemPress(item.id);
  };

  return (
    <TouchableOpacity
      testID={`web3hub-tab-item-${item.manifestId}`}
      style={{ flex: 1 }}
      onPress={goToApp}
    >
      <View style={styles.container}>
        <Flex
          flexDirection="row"
          backgroundColor={colors.background}
          height={30}
          alignItems={"center"}
          paddingX={3}
          columnGap={5}
        >
          {imageLoaded && item.icon ? (
            <Image
              source={{
                uri: item.icon,
              }}
              style={styles.icon}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <View style={{ ...styles.icon, backgroundColor: colors.black }} />
          )}

          <Text style={{ ...styles.title, flex: 1, color: "#C3C3C3" }}>{item.title}</Text>

          <TouchableOpacity onPress={handlePressClose}>
            <IconsLegacy.CloseMedium size={16} color={"#C3C3C3"} />
          </TouchableOpacity>
        </Flex>

        <View style={{ flex: 1, height: 30, backgroundColor: "white" }}>
          <Image source={{ uri: item.previewUri }} style={{ width: "100%", height: "100%" }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 180,
    backgroundColor: "white",
    marginHorizontal: 8,
    marginVertical: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  title: { color: "black" },
  icon: {
    width: 15,
    height: 15,
    borderRadius: 4,
  },
});
