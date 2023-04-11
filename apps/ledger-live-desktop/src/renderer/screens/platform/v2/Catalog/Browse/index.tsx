import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { DisclaimerRaw, Categories } from "@ledgerhq/live-common/wallet-api/react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { Search as SearchType } from "@ledgerhq/live-common/hooks/useSearch";
import { SectionHeader } from "../SectionHeader";
import { Search } from "./Search";
import { useTranslation } from "react-i18next";
import { Result } from "./Result";

interface Props {
  categories: Pick<Categories, "categories" | "setSelected">;
  search: Pick<SearchType<AppManifest, undefined>, "input" | "onChange" | "result">;
  disclaimer: Pick<DisclaimerRaw, "onSelect">;
}

export function Browse({ categories, search, disclaimer }: Props) {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column">
      <SectionHeader iconLeft="Globe">{t("platform.catalog.section.browse")}</SectionHeader>

      <Search categories={categories} search={search} />
      <Result search={search} disclaimer={disclaimer} />
    </Flex>
  );
}
