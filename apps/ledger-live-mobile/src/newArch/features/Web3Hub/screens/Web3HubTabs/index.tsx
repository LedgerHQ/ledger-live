import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import type { TabData, TabsProps } from "LLM/features/Web3Hub/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigatorName, ScreenName } from "~/const";
import TabItem, { useTabHistory } from "../../components/TabItem";
import Header from "./components/Header";

const edges = ["top", "bottom", "left", "right"] as const;

const identityFn = (item: TabData) => item.id;

const newTab = "New tab";

export default function Web3HubTabs({ navigation }: TabsProps) {
  const { colors } = useTheme();
  const [tabs, setTabs] = useState<TabData[]>([]);
  const { tabHistory } = useTabHistory();

  const listRef = useRef(null);

  const goToSearch = useCallback(() => {
    navigation.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubSearch,
    });
  }, [navigation]);

  useEffect(() => {
    setTabs(tabHistory);

    const timer = setTimeout(() => {
      setTabs(tabHistory);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tabHistory]);

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
          renderItem={({ item }) => (
            <TabItem item={item} extraData={{ colors: colors }} navigation={navigation} />
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
});
