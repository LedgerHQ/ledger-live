import React, { useMemo, useCallback } from "react";
import { Flex, SearchInput, Text, SelectInput } from "@ledgerhq/react-ui";
import { Search as SearchType } from "../../hooks";
import { Categories } from "@ledgerhq/live-common/wallet-api/react";
import { useTranslation } from "react-i18next";

export interface Props {
  categories: Pick<Categories, "categories" | "setSelected">;
  search: Pick<SearchType, "input" | "onChange">;
}

export function Search({ categories, search }: Props) {
  const { t } = useTranslation();

  const options = useMemo(
    () => categories.categories.map(value => ({ value: value, label: value.toUpperCase() })),
    [categories],
  );

  const onChange = useCallback(
    ({ value }: (typeof options)[number]) => {
      categories.setSelected(value);
    },
    [categories],
  );

  return (
    <Flex marginY={4}>
      <SearchInput
        placeholder={t("common.search")}
        value={search.input}
        onChange={search.onChange}
      />
      <Flex alignItems="center" justifyContent="flex-end" flex={1}>
        <Text paddingX={2} color="opacityDefault.c50" fontSize={13}>
          {t("platform.catalog.filter.categories")}
        </Text>

        <SelectInput
          isDisabled={!!search.input.length}
          options={options}
          defaultValue={options[0]}
          // @ts-expect-error another SelectInput hell
          onChange={onChange}
          styles={{ container: baseStyles => ({ ...baseStyles, width: 240 }) }}
        />
      </Flex>
    </Flex>
  );
}
