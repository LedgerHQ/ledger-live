import React, { memo, useState, useCallback } from "react";
import { TouchableOpacity } from "react-native";

import { Icons, Box } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import NotifBadge from "../NotifBadge";

import FilterModalComponent from "../Modals/FilterModal";

type Props = {
  filter: string;
  setFilter: (filter: string) => void;
  sort: string;
  setSort: (sort: string) => void;
  order: string;
  setOrder: (order: string) => void;
  disabled: boolean;
  filters: string[];
};

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
  sort,
  setSort,
  order,
  setOrder,
  disabled,
  filters = [],
}: Props) => {
  const [isOpened, setOpenModal] = useState(false);
  const openModal = useCallback(() => setOpenModal(true), [setOpenModal]);
  const closeModal = useCallback(() => setOpenModal(false), [setOpenModal]);

  return (
    <>
      <TouchableOpacity disabled={disabled} onPress={openModal}>
        <FilterButtonContainer borderColor="neutral.c40">
          <Box>
            <Icons.FiltersMedium size={18} color="neutral.c100" />
            {filter !== "all" && <NotifBadge />}
          </Box>
        </FilterButtonContainer>
      </TouchableOpacity>
      <FilterModalComponent
        isOpened={isOpened}
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        order={order}
        setOrder={setOrder}
        onClose={closeModal}
      />
    </>
  );
};

export default memo(AppFilter);
