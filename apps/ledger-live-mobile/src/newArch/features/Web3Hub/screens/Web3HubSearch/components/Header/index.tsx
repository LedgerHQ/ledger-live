import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { SharedValue } from "react-native-reanimated";
import { Flex } from "@ledgerhq/native-ui";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import AnimatedBar from "LLM/features/Web3Hub/components/AnimatedBar";
import BackButton from "LLM/features/Web3Hub/components/BackButton";
import TabButton from "LLM/features/Web3Hub/components/TabButton";
import { SearchProps } from "LLM/features/Web3Hub/types";
import TextInput from "~/components/TextInput";

const SEARCH_HEIGHT = 60;
export const TOTAL_HEADER_HEIGHT = SEARCH_HEIGHT;
const ANIMATION_HEIGHT = TOTAL_HEADER_HEIGHT;

type Props = {
  navigation: SearchProps["navigation"];
  onSearch: (search: string) => void;
  layoutY: SharedValue<number>;
};

export default function Web3HubSearchHeader({ navigation, onSearch, layoutY }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <AnimatedBar
      pt={insets.top}
      layoutY={layoutY}
      style={styles.bar}
      backgroundColor={colors.background}
      animationHeight={ANIMATION_HEIGHT}
      opacityHeight={TOTAL_HEADER_HEIGHT}
      totalHeight={TOTAL_HEADER_HEIGHT}
      opacityChildren={
        <Flex flex={1} height={SEARCH_HEIGHT} flexDirection="row" alignItems="center">
          <BackButton onPress={navigation.goBack} />
          <Flex flex={1}>
            <TextInput
              autoFocus
              role="searchbox"
              placeholder={t("web3hub.main.header.placeholder")}
              keyboardType="default"
              returnKeyType="done"
              value={search}
              onChangeText={setSearch}
            />
          </Flex>
          <TabButton count={2} navigation={navigation} />
        </Flex>
      }
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    zIndex: 1,
    position: "absolute",
    width: "100%",
  },
});
