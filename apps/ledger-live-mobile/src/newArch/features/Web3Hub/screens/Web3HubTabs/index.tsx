import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import type { TabsProps } from "LLM/features/Web3Hub/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigatorName, ScreenName } from "~/const";
import deviceStorage from "~/logic/storeWrapper";
import Header from "./components/Header";

const edges = ["top", "bottom", "left", "right"] as const;

export type Web3HubTabType = {
  id: string;
  manifestId: string;
  icon: string;
  title: string;
  link?: string;
  previewUri: string;
  url: string;
};

const identityFn = (item: Web3HubTabType) => item.id;

const newTab = "New tab";

const TabItem = ({
  item,
  onItemPress,
  extraData,
  navigation,
}: {
  item: Web3HubTabType;
  onItemPress: (itemId: string) => void;
  navigation: TabsProps["navigation"];
  extraData: { background: string };
}) => {
  const [imageLoaded, setImageLoaded] = useState(true);
  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => setImageLoaded(false), []);

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
    <TouchableOpacity style={{ flex: 1 }} onPress={goToApp}>
      <View style={styles.itemContainer}>
        <Flex
          flexDirection="row"
          backgroundColor={extraData.background}
          height={30}
          alignItems={"center"}
          paddingX={3}
          columnGap={5}
        >
          {imageLoaded ? (
            <Image
              source={{
                uri: item.icon,
              }}
              style={styles.icon}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <View style={styles.icon} />
          )}

          <Text style={{ ...styles.tabTitle, flex: 1, color: "#C3C3C3" }}>{item.title}</Text>

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
};

export default function Web3HubTabs({ navigation }: TabsProps) {
  const { colors } = useTheme();
  const [tabs, setTabs] = useState<Web3HubTabType[]>([]);
  const listRef = useRef(null);

  const handleItemPress = (itemId: string) => {
    const now = tabs.filter(item => item.id !== itemId);
    deviceStorage.save("web3hubTabHistory", now);
    setTabs(now);
  };

  /** @todo(Canestin) Remove */
  // deviceStorage.delete("web3hubTabHistory");

  const goToSearch = useCallback(() => {
    navigation.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubSearch,
      options: {
        presentation: "modal",
        animation: "slide_from_bottom",
      },
    });
  }, [navigation]);

  useEffect(() => {
    const getTabs = async () => {
      try {
        const tabHistory = (await deviceStorage.get("web3hubTabHistory")) || [];
        setTabs(tabHistory);
      } catch (error) {
        console.error("Error fetching tabs from storage:", error);
      }
    };

    getTabs();

    const timer = setTimeout(() => {
      getTabs();
    }, 400);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView edges={edges} style={{ flex: 1 }}>
      <Header title={`${tabs.length} tabs`} navigation={navigation} />

      <View style={styles.container}>
        <FlashList
          ref={listRef}
          testID="web3hub-tabs-scroll"
          keyExtractor={identityFn}
          renderItem={({ item }) => (
            <TabItem
              item={item}
              extraData={{ background: colors.background }}
              onItemPress={handleItemPress}
              navigation={navigation}
            />
          )}
          estimatedItemSize={50}
          data={tabs}
          numColumns={2}
        />
      </View>

      <TouchableOpacity onPress={goToSearch}>
        <Flex
          height={80}
          flexDirection="row"
          backgroundColor={colors.background}
          justifyContent={"center"}
          paddingY={5}
        >
          <Flex
            style={{
              height: 40,
              backgroundColor: "#252424",
              paddingHorizontal: 15,
              paddingVertical: 8,
              borderRadius: 30,
            }}
            flexDirection="row"
            justifyContent={"center"}
            alignItems={"center"}
            columnGap={2}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>{newTab}</Text>
            <IconsLegacy.PlusMedium size={16} color={"black"} />
          </Flex>
        </Flex>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    paddingVertical: 10,
  },
  tabTitle: { color: "black" },
  itemContainer: {
    flex: 1,
    height: 180,
    backgroundColor: "white",
    marginHorizontal: 8,
    marginVertical: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  icon: {
    width: 15,
    height: 15,
    borderRadius: 4,
  },
});
