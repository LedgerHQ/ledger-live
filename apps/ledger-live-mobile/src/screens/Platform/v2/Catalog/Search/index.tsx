import React from "react";
import { Linking, TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import * as Animatable from "react-native-animatable";
import { Flex, Text, InfiniteLoader } from "@ledgerhq/native-ui";
import { Trans, useTranslation } from "react-i18next";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import ArrowLeft from "../../../../../icons/ArrowLeft";
import { TAB_BAR_SAFE_HEIGHT } from "../../../../../components/TabBar/TabBarSafeAreaView";
import { Layout } from "../Layout";
import { SearchBarValues } from "../types";
import Illustration from "../../../../../images/illustration/Illustration";
import { ManifestList } from "../ManifestList";
import { SearchBar } from "./SearchBar";

export * from "./SearchBar";

const noResultIllustration = {
  dark: require("../../../../../images/illustration/Dark/_051.png"),
  light: require("../../../../../images/illustration/Light/_051.png"),
};

const AnimatedView = Animatable.View;

const httpRegex = new RegExp(
  /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi,
);

type Props = {
  manifests: LiveAppManifest[];
  recentlyUsed: LiveAppManifest[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  listTitle?: React.ReactNode;
  backAction?: () => void;
  onSelect: (manifest: LiveAppManifest) => void;
} & Omit<SearchBarValues<LiveAppManifest>, "onCancel">;

export function Search({
  manifests,
  title,
  onSelect,
  input,
  inputRef,
  result,
  isSearching,
  backAction,
  onChange,
  onFocus,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const isSearchBarEmpty = input === "";

  const isResultFound = !isSearchBarEmpty && result?.length !== 0;

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
        {t("market.warnings.notFound")}
      </Text>
      <Text textAlign="center" variant="body" color="neutral.c70">
        {input.match(httpRegex) ? (
          <Trans
            i18nKey="market.warnings.retrySearchKeywordAndUrl"
            values={{
              search: input,
            }}
            components={{
              Link: (
                <Text
                  style={{ textDecorationLine: "underline" }}
                  onPress={() => Linking.openURL("http://" + input)}
                >
                  {"eiihirer"}
                </Text>
              ),
            }}
          />
        ) : (
          t("market.warnings.retrySearchKeyword")
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
            onPress={backAction}
          >
            <ArrowLeft size={18} color={colors.neutral.c100} />
          </TouchableOpacity>
        }
        searchContent={
          <SearchBar
            input={input}
            inputRef={inputRef}
            onChange={onChange}
            onFocus={onFocus}
          />
        }
        bodyContent={
          isSearching ? (
            <Flex marginTop={100}>
              <InfiniteLoader size={40} />
            </Flex>
          ) : (
            <AnimatedView animation="fadeInUp" delay={50} duration={300}>
              <Flex paddingTop={4} paddingBottom={TAB_BAR_SAFE_HEIGHT + 50}>
                {isSearchBarEmpty ? (
                  <ManifestList onSelect={onSelect} manifests={manifests} />
                ) : isResultFound ? (
                  <ManifestList onSelect={onSelect} manifests={result} />
                ) : (
                  noResultFoundComponent
                )}
              </Flex>
            </AnimatedView>
          )
        }
      />
    </>
  );
}
