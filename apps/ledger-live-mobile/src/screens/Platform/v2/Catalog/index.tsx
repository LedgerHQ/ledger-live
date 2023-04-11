import React, { useCallback, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import * as Animatable from "react-native-animatable";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import Fuse from "fuse.js";
import ArrowLeft from "../../../../icons/ArrowLeft";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../../components/TabBar/TabBarSafeAreaView";
import { Layout } from "./Layout";
import {
  useCategories,
  useDeeplinkEffect,
  useDisclaimer,
  useSearch,
  useRecentlyUsed,
} from "./hooks";
import TrackScreen from "../../../../analytics/TrackScreen";
import { Search, SearchBar } from "./Search";
import { ManifestList } from "./ManifestList";
import { RecentlyUsed } from "./RecentlyUsed";
import { CatalogSection } from "./CatalogSection";
import { DAppDisclaimer } from "./DAppDisclaimer";
import { Props } from "../../Catalog";

const AnimatedView = Animatable.View;

const options: Fuse.IFuseOptions<LiveAppManifest> = {
  keys: ["name"],
  threshold: 0.1,
};

export function Catalog({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const title = t("browseWeb3.catalog.title");

  const {
    manifestsByCategories,
    manifests,
    categories,
    selected,
    setSelected,
    initialSelectedState,
  } = useCategories();

  const recentlyUsed = useRecentlyUsed(manifests);

  const {
    input,
    inputRef,
    onChange,
    onCancel,
    onFocus,
    isActive,
    isSearching,
    result,
  } = useSearch({
    list: manifests,
    options,
  });

  // TODO: Move inside the custom hook
  useEffect(() => {
    isActive && setSelected(initialSelectedState);
  }, [isActive, setSelected, initialSelectedState]);

  const {
    isDismissed,
    isReadOnly,
    openApp,
    prompt,
    name,
    icon,
    isOpened,
    onClose,
    isChecked,
    toggleCheck,
    onContinue,
  } = useDisclaimer(recentlyUsed.append);

  useDeeplinkEffect(manifests, openApp);

  const onSelect = useCallback(
    (manifest: LiveAppManifest) => {
      if (!isDismissed && !isReadOnly && manifest.author !== "ledger") {
        prompt(manifest);
      } else {
        openApp(manifest);
      }
    },
    [isDismissed, isReadOnly, openApp, prompt],
  );

  return (
    <TabBarSafeAreaView edges={["bottom", "left", "right"]}>
      {/* TODO: put under the animation header and style  */}
      <TrackScreen category="Platform" name="Catalog" />
      <DAppDisclaimer
        name={name}
        icon={icon}
        isOpened={isOpened}
        onClose={onClose}
        isChecked={isChecked}
        toggleCheck={toggleCheck}
        onContinue={onContinue}
      />

      {isActive ? (
        <Search
          manifests={manifests}
          recentlyUsed={recentlyUsed.data}
          title={title}
          input={input}
          inputRef={inputRef}
          backAction={onCancel}
          onChange={onChange}
          onFocus={onFocus}
          result={result}
          isSearching={isSearching}
          isActive={isActive}
          onSelect={onSelect}
        />
      ) : (
        <>
          <Layout
            title={title}
            listStickyElement={[3]}
            topHeaderContent={
              <TouchableOpacity
                hitSlop={{
                  bottom: 10,
                  left: 24,
                  right: 24,
                  top: 10,
                }}
                style={{ paddingVertical: 16 }}
                onPress={navigation.goBack}
              >
                <ArrowLeft size={18} color={colors.neutral.c100} />
              </TouchableOpacity>
            }
            titleHeaderContent={
              <Flex marginBottom={16}>
                <Text fontWeight="bold" variant="h1Inter">
                  {title}
                </Text>
                <Text variant="large">{t("browseWeb3.catalog.subtitle")}</Text>
              </Flex>
            }
            middleHeaderContent={
              <SearchBar
                input={input}
                inputRef={inputRef}
                onChange={onChange}
                onFocus={onFocus}
              />
            }
            disableStyleBottomHeader
            bottomHeaderContent={
              <RecentlyUsed
                recentlyUsed={recentlyUsed.data}
                onSelect={onSelect}
                onClear={recentlyUsed.clear}
              />
            }
            disableStyleSubBottomHeader
            subBottomHeaderContent={
              <CatalogSection
                categories={categories}
                selected={selected}
                setSelected={setSelected}
              />
            }
            bodyContent={
              <AnimatedView animation="fadeInUp" delay={50} duration={300}>
                <Flex paddingTop={4} paddingBottom={TAB_BAR_SAFE_HEIGHT}>
                  <ManifestList
                    onSelect={onSelect}
                    manifests={manifestsByCategories.get(selected) || []}
                  />
                </Flex>
              </AnimatedView>
            }
          />
        </>
      )}
    </TabBarSafeAreaView>
  );
}
