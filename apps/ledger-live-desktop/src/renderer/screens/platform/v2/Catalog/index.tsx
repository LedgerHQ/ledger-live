import React from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Text, Flex } from "@ledgerhq/react-ui";
import { RecentlyUsed } from "./RecentlyUsed";
import { Browse } from "./Browse";
import { useTranslation } from "react-i18next";
import { useCatalog, useDiscoverDB } from "../hooks";

export function Catalog() {
  const discoverDB = useDiscoverDB();

  const { t } = useTranslation();
  const { categories, recentlyUsed, disclaimer, search } = useCatalog(discoverDB);

  return (
    <Flex flexDirection="column" paddingBottom={100}>
      <TrackPage category="Platform" name="Catalog" />

      <Text variant="h3" style={{ fontSize: 28 }}>
        {t("platform.catalog.title")}
      </Text>

      {recentlyUsed.data.length ? (
        <RecentlyUsed recentlyUsed={recentlyUsed} disclaimer={disclaimer} />
      ) : null}

      <Browse categories={categories} search={search} disclaimer={disclaimer} />
    </Flex>
  );
}
