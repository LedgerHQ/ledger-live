import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { SharedValue } from "react-native-reanimated";
import { Flex } from "@ledgerhq/native-ui";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import AnimatedBar from "LLM/features/Web3Hub/components/AnimatedBar";
import BackButton from "LLM/features/Web3Hub/components/BackButton";
import ClearButton from "LLM/features/Web3Hub/components/ClearButton";
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

  const clearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const inputContainerStyle = useMemo(() => {
    return {
      paddingLeft: 0,
      paddingRight: search ? 0 : 16,
    };
  }, [search]);

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
          <Flex flex={1} mx={5}>
            <TextInput
              inputContainerStyle={inputContainerStyle}
              renderLeft={<BackButton onPress={navigation.goBack} />}
              renderRight={search ? <ClearButton onPress={clearSearch} /> : undefined}
              autoFocus
              role="searchbox"
              placeholder={t("web3hub.main.header.placeholder")}
              keyboardType="default"
              returnKeyType="done"
              value={search}
              onChangeText={setSearch}
            />
          </Flex>
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
