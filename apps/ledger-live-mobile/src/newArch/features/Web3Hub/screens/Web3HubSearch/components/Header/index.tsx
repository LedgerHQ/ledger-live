import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Box, Flex } from "@ledgerhq/native-ui";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import BackButton from "LLM/features/Web3Hub/components/BackButton";
import TabButton from "LLM/features/Web3Hub/components/TabButton";
import { SearchProps } from "LLM/features/Web3Hub/types";
import TextInput from "~/components/TextInput";

const SEARCH_HEIGHT = 60;

type Props = {
  navigation: SearchProps["navigation"];
  onSearch: (search: string) => void;
};

export default function Web3HubSearchHeader({ navigation, onSearch }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <Box
      backgroundColor={colors.background}
      paddingTop={insets.top}
      height={SEARCH_HEIGHT + insets.top}
    >
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
            // onSubmitEditing={text => console.log("onSubmitEditing: ", text)}
          />
        </Flex>
        <TabButton count={2} navigation={navigation} />
      </Flex>
    </Box>
  );
}
