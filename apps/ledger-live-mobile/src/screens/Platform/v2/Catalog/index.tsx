import React, { useCallback, useEffect, useMemo } from "react";
import * as Animatable from "react-native-animatable";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import Fuse from "fuse.js";
import { useManifests } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
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

const AnimatedView = Animatable.View;

const options: Fuse.IFuseOptions<LiveAppManifest> = {
  keys: ["name", "categories"],
  threshold: 0.1,
};

export function Catalog() {
  const { t } = useTranslation();
  const title = t("browseWeb3.catalog.title");

  const manifestsSearchableVisibility: LiveAppManifest[] = useManifests({
    visibility: "searchable",
  });

  const manifestsCompleteVisibility: LiveAppManifest[] = useManifests({
    visibility: "complete",
  });

  const manifests = useMemo(
    () => [...manifestsSearchableVisibility, ...manifestsCompleteVisibility],
    [],
  );

  const {
    manifestsByCategories,
    categories,
    selected,
    setSelected,
    initialSelectedState,
  } = useCategories(manifestsCompleteVisibility);

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
          manifests={manifestsCompleteVisibility}
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
            listStickyElement={[2]}
            middleHeaderContent={
              <>
                <Flex marginBottom={16}>
                  <Text fontWeight="semiBold" variant="h4">
                    {title}
                  </Text>
                </Flex>
                <SearchBar
                  input={input}
                  inputRef={inputRef}
                  onChange={onChange}
                  onFocus={onFocus}
                />
              </>
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
