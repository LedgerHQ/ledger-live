import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Box, Flex, Icons } from "@ledgerhq/native-ui";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import TextInput from "~/components/TextInput";
import Touchable from "~/components/Touchable";

const SEARCH_HEIGHT = 60;

type Props = {
  navigation: NativeStackHeaderProps["navigation"];
  onSearch: (search: string) => void;
};

export default function Web3HubMainHeader({ navigation, onSearch }: Props) {
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
      <Flex height={SEARCH_HEIGHT} flexDirection="row" alignItems="center">
        <Touchable testID="navigation-header-back-button" onPress={navigation.goBack}>
          <Box p={5}>
            <Icons.ArrowLeft />
          </Box>
        </Touchable>
        <Box width={"80%"}>
          <TextInput
            autoFocus
            testID="web3hub-search-header-search"
            placeholder={t("web3hub.main.header.placeholder")}
            keyboardType="default"
            returnKeyType="done"
            value={search}
            onChangeText={setSearch}
            // onSubmitEditing={text => console.log("onSubmitEditing: ", text)}
          />
        </Box>
      </Flex>
    </Box>
  );
}
