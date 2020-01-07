import React, { memo, useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import Filters from "../../../icons/Filters";
import Button from "../../../components/Button";
import NotifBadge from "../../../components/NotifBadge";

import FilterModalComponent from "../Modals/FilterModal";

type Props = {
  filters: string[],
  setFilters: string => void,
  sort: string,
  setSort: string => void,
  order: string,
  setOrder: string => void,
};

const AppFilter = ({
  filters,
  setFilters,
  sort,
  setSort,
  order,
  setOrder,
}: Props) => {
  const [isOpened, setOpenModal] = useState(false);
  const openModal = useCallback(() => setOpenModal(true), [setOpenModal]);
  const closeModal = useCallback(() => setOpenModal(false), [setOpenModal]);

  return (
    <>
      <View>
        <Button
          containerStyle={styles.searchBarFilters}
          type="darkSecondary"
          IconLeft={Filters}
          onPress={openModal}
        />
        {filters.length > 0 && <NotifBadge />}
      </View>
      <FilterModalComponent
        isOpened={isOpened}
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        order={order}
        setOrder={setOrder}
        onClose={closeModal}
      />
    </>
  );
};

AppFilter.defaultProps = {
  filters: [],
};

const styles = StyleSheet.create({
  searchBarFilters: {
    width: 44,
    height: 44,
  },
});

export default memo(AppFilter);
