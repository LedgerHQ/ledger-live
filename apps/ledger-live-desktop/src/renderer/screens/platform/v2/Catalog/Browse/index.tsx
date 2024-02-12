import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { DisclaimerRaw, Categories } from "@ledgerhq/live-common/wallet-api/react";
import { Search as SearchType } from "../../hooks";
import { SectionHeader } from "../SectionHeader";
import { Search } from "./Search";
import { useTranslation } from "react-i18next";
import { Result } from "./Result";

interface Props {
  categories: Pick<Categories, "categories" | "setSelected" | "selected">;
  search: Pick<SearchType, "input" | "onChange" | "result" | "isSearching">;
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
