import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Text, Flex } from "@ledgerhq/react-ui";
import { RecentlyUsed } from "./RecentlyUsed";
import { Browse } from "./Browse";
import { useTranslation } from "react-i18next";
import { useCatalog, useRecentlyUsedDB } from "../hooks";
import { LocalLiveAppSection } from "./LocalLiveAppSection";
import { useLocation } from "react-router-dom";
import { Categories } from "@ledgerhq/live-common/wallet-api/react";

export function Catalog() {
  const recentlyUsedDB = useRecentlyUsedDB();

  const { t } = useTranslation();

  const { state } = useLocation<{
    category?: Categories["selected"];
  }>();

  const deeplinkInitialCategory = state?.category;

  const {
    categories,
    recentlyUsed,
    disclaimer,
    search: searchInput,
    localLiveApps,
  } = useCatalog(recentlyUsedDB, deeplinkInitialCategory);

  return (
    <Flex flexDirection="column" paddingBottom={100}>
      <TrackPage category="Platform" name="Catalog" />

      <Text variant="h3" style={{ fontSize: 28 }}>
        {t("platform.catalog.title")}
      </Text>

      {localLiveApps.length ? <LocalLiveAppSection localLiveApps={localLiveApps} /> : null}

      {recentlyUsed.data.length ? (
        <RecentlyUsed recentlyUsed={recentlyUsed} disclaimer={disclaimer} />
      ) : null}

      <Browse categories={categories} search={searchInput} disclaimer={disclaimer} />
    </Flex>
  );
}
