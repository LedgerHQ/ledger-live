import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Flex, Text, InfiniteLoader } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "~/context/Locale";
import { HTTP_REGEX } from "@ledgerhq/live-common/wallet-api/constants";
import ArrowLeft from "~/icons/ArrowLeft";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import { Layout } from "../Layout";
import Illustration from "~/images/illustration/Illustration";
import { ManifestList } from "../ManifestList";
import { SearchBar } from "./SearchBar";
import { Disclaimer } from "../../hooks";
import { Search as SearchType } from "../../types";

export * from "./SearchBar";

const noResultIllustration = {
  dark: require("~/images/illustration/Dark/_051.webp"),
  light: require("~/images/illustration/Light/_051.webp"),
};

interface Props {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  listTitle?: React.ReactNode;
  disclaimer: Pick<Disclaimer, "onSelect">;
  search: SearchType;
}

export function Search({ title, disclaimer, search }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const noResultFoundComponent = (
    <Flex flexDirection={"column"} padding={4} marginTop={100}>
      <Flex alignItems="center">
        <Illustration
          size={164}
          lightSource={noResultIllustration.light}
          darkSource={noResultIllustration.dark}
        />
      </Flex>
      <Text textAlign="center" variant="h4" my={3}>
        {t("browseWeb3.catalog.warnings.notFound")}
      </Text>
      <Text textAlign="center" variant="body" color="neutral.c70">
        {search.input.match(HTTP_REGEX) && (
          <Trans
            i18nKey="browseWeb3.catalog.warnings.retrySearchKeywordAndUrl"
            values={{
              search: search.input,
            }}
            components={{
              Link: (
                <Text
                  style={{ textDecorationLine: "underline" }}
                  onPress={() => Linking.openURL("http://" + search.input)}
                >
                  {""}
                </Text>
              ),
            }}
          />
        )}
      </Text>
    </Flex>
  );

  return (
    <>
      <Layout
        isTitleVisible={true}
        title={title}
        topHeaderContent={
          <TouchableOpacity
            hitSlop={{
              bottom: 10,
              left: 24,
              right: 24,
              top: 10,
            }}
            style={{ paddingVertical: 16 }}
            onPress={search.onCancel}
          >
            <ArrowLeft size={18} color={colors.neutral.c100} testID="catalog-search-arrow-left" />
          </TouchableOpacity>
        }
        searchContent={<SearchBar search={search} />}
        bodyContent={
          search.isSearching ? (
            <Flex marginTop={100}>
              <InfiniteLoader size={40} />
            </Flex>
          ) : (
            <Animated.View entering={FadeInUp.delay(50).duration(300)}>
              <Flex paddingTop={4} paddingBottom={TAB_BAR_SAFE_HEIGHT + 50}>
                {!!search.input.length && !search.result.length ? (
                  noResultFoundComponent
                ) : (
                  <ManifestList manifests={search.result} onSelect={disclaimer.onSelect} />
                )}
              </Flex>
            </Animated.View>
          )
        }
      />
    </>
  );
}
