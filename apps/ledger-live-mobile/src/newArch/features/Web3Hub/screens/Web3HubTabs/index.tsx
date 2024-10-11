import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import type { TabData, TabsProps } from "LLM/features/Web3Hub/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigatorName, ScreenName } from "~/const";
import Header from "./components/Header";
import deviceStorage from "~/logic/storeWrapper";
import TabItem from "./components/TabItem";

const edges = ["top", "bottom", "left", "right"] as const;

const identityFn = (item: TabData) => item.id;

const newTab = "New tab";

type PropRenderItem = {
  item: TabData;
  extraData?: {
    navigation: TabsProps["navigation"];
    handleItemClosePress: (itemId: string) => void;
  };
};

const renderItem = ({ item, extraData }: PropRenderItem) => {
  if (!extraData) return null;
  return (
    <TabItem
      item={item}
      navigation={extraData?.navigation}
      onItemClosePress={extraData?.handleItemClosePress}
    />
  );
};

export default function Web3HubTabs({ navigation }: TabsProps) {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const listRef = useRef(null);
  const { colors } = useTheme();

  const handleItemClosePress = (itemId: string) => {
    const filteredTabs = tabs.filter(item => item.id !== itemId);
    deviceStorage.save("web3hub__TabHistory", filteredTabs);
    setTabs(filteredTabs);
  };

  const goToSearch = useCallback(() => {
    navigation.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubSearch,
    });
  }, [navigation]);

  useEffect(() => {
    const getTabs = async () => {
      try {
        const tabHistory = ((await deviceStorage.get("web3hub__TabHistory")) as TabData[]) || [];
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
  }, []);

  return (
    <SafeAreaView edges={edges} style={{ flex: 1 }}>
      <Header
        title={`${tabs.length} ${tabs.length > 1 ? "tabs" : "tab"}`}
        navigation={navigation}
      />

      <View style={styles.container}>
        <FlashList
          ref={listRef}
          testID="web3hub-tabs-scroll"
          keyExtractor={identityFn}
          renderItem={renderItem}
          estimatedItemSize={50}
          data={tabs}
          numColumns={2}
          extraData={{
            navigation,
            handleItemClosePress,
          }}
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
});
