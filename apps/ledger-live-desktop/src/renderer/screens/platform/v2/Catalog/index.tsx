import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Text, Flex } from "@ledgerhq/react-ui";
import { RecentlyUsed } from "./RecentlyUsed";
import { Browse } from "./Browse";
import { useTranslation } from "react-i18next";
import { useCatalog, useRecentlyUsedDB } from "../hooks";
import { LocalLiveAppSection } from "./LocalLiveAppSection";
import { useLocation } from "react-router";
import { Categories } from "@ledgerhq/live-common/wallet-api/react";
import PageHeader from "LLD/components/PageHeader";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

export function Catalog() {
  const recentlyUsedDB = useRecentlyUsedDB();

  const { t } = useTranslation();

  const location = useLocation();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const state = location.state as {
    category?: Categories["selected"];
  } | null;

  const deeplinkInitialCategory = state?.category;

  const {
    categories,
    recentlyUsed,
    disclaimer,
    search: searchInput,
    localLiveApps,
  } = useCatalog(recentlyUsedDB, deeplinkInitialCategory);

  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("desktop");

  return (
    <Flex flexDirection="column" paddingBottom={100}>
      <TrackPage category="Platform" name="Catalog" />

      {shouldDisplayWallet40MainNav ? (
        <div className="pb-24">
          <PageHeader title={t("platform.catalog.title")} />
        </div>
      ) : (
        <Text variant="h3" style={{ fontSize: 28 }}>
          {t("platform.catalog.title")}
        </Text>
      )}

      {localLiveApps.length ? <LocalLiveAppSection localLiveApps={localLiveApps} /> : null}

      {recentlyUsed.data.length ? (
        <RecentlyUsed recentlyUsed={recentlyUsed} disclaimer={disclaimer} />
      ) : null}

      <Browse categories={categories} search={searchInput} disclaimer={disclaimer} />
    </Flex>
  );
}
