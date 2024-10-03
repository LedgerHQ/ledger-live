import React, { useCallback, useState } from "react";
import { useTheme, useFocusEffect } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { BorderlessButton } from "react-native-gesture-handler";
import type { AppProps, MainProps, SearchProps } from "LLM/features/Web3Hub/types";
import { NavigatorName, ScreenName } from "~/const";
import { Web3HubTabType } from "../../screens/Web3HubTabs/components/TabItem";
import deviceStorage from "~/logic/storeWrapper";

type Props = {
  count?: number;
  onclick?: () => void;
  navigation: MainProps["navigation"] | SearchProps["navigation"] | AppProps["navigation"];
};

export default function TabButton({ navigation, onclick }: Props) {
  const { colors } = useTheme();
  const [count, setCount] = useState("");

  useFocusEffect(
    useCallback(() => {
      const getTabCount = async () => {
        const tabCount = (await deviceStorage.get("web3hubTabHistory")) as Web3HubTabType[];
        setCount(tabCount.length.toString());
      };

      getTabCount();
    }, []),
  );

  const handleClick = () => {
    if (onclick) {
      onclick();
    }

    navigation.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubTabs,
    });
  };

  return (
    <BorderlessButton onPress={handleClick} activeOpacity={0.5} borderless={false}>
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
