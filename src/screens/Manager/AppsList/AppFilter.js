import React, { memo, useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import Filters from "../../../icons/Filters";
import Button from "../../../components/Button";
import NotifBadge from "../../../components/NotifBadge";

import FilterModalComponent from "../Modals/FilterModal";

type Props = {
  filter: ?string,
  setFilter: string => void,
  sort: string,
  setSort: string => void,
  order: string,
  setOrder: string => void,
  disabled: boolean,
};

const AppFilter = ({
  filter,
  setFilter,
  sort,
  setSort,
  order,
  setOrder,
  disabled,
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
          disabled={disabled}
          useTouchable
          event="ManagerAppFilterOpenModal"
        />
        {filter !== "all" && <NotifBadge />}
      </View>
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
