import React, { memo, useState, useCallback, useMemo } from "react";
import { TouchableOpacity } from "react-native";

import { IconsLegacy, Box } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import { AppType, SortOptions } from "@ledgerhq/live-common/apps/filtering";
import type { AppDeveloperFilter } from "@ledgerhq/live-common/apps/developer";
import NotifBadge from "../NotifBadge";

import FilterModalComponent from "../Modals/FilterModal";

type Props = {
  filter: string | null | undefined;
  setFilter: (_: AppType | null | undefined) => void;
  /** Developer filter; the section is hidden when setDeveloper is not given. */
  developer?: AppDeveloperFilter;
  setDeveloper?: (_: AppDeveloperFilter) => void;
  sort: string | null | undefined;
  setSort: (_: SortOptions["type"] | null | undefined) => void;
  order: string | null | undefined;
  setOrder: (_: SortOptions["order"] | null | undefined) => void;
  disabled?: boolean;
};

type SetStateCallback = (_: string | null | undefined) => void;

const isAppDeveloperFilter = (value: string | null | undefined): value is AppDeveloperFilter =>
  value === "all" || value === "ledger" || value === "community";

const FilterButtonContainer = styled(Box).attrs({
  width: 48,
  height: 48,
  borderWidth: 1,
  borderRadius: 50,
  alignItems: "center",
  justifyContent: "center",
})``;

const AppFilter = ({
  filter,
  setFilter,
  developer,
  setDeveloper,
  sort,
  setSort,
  order,
  setOrder,
  disabled,
}: Props) => {
  const [isOpened, setOpenModal] = useState(false);
  const openModal = useCallback(() => setOpenModal(true), [setOpenModal]);
  const closeModal = useCallback(() => setOpenModal(false), [setOpenModal]);
  const onDeveloperChange = useMemo<SetStateCallback | undefined>(
    () =>
      setDeveloper ? value => setDeveloper(isAppDeveloperFilter(value) ? value : "all") : undefined,
    [setDeveloper],
  );

  return (
    <>
      <TouchableOpacity disabled={disabled} onPress={openModal}>
        <FilterButtonContainer borderColor="neutral.c40">
          <Box>
            <IconsLegacy.FiltersMedium size={18} color="neutral.c100" />
            {(filter !== "all" || (developer && developer !== "all")) && <NotifBadge />}
          </Box>
        </FilterButtonContainer>
      </TouchableOpacity>
      <FilterModalComponent
        isOpened={isOpened}
        filter={filter}
        setFilter={setFilter as SetStateCallback}
        developer={developer}
        setDeveloper={onDeveloperChange}
        sort={sort}
        setSort={setSort as SetStateCallback}
        order={order}
        setOrder={setOrder as SetStateCallback}
        onClose={closeModal}
      />
    </>
  );
};

export default memo(AppFilter);
