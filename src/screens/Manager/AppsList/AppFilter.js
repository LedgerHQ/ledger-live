import React, { memo, useState, useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import Filters from "../../../icons/Filters";
import Button from "../../../components/Button";
import NotifBadge from "../../../components/NotifBadge";

import FilterModalComponent from "../Modals/FilterModal";

type Props = {
  filter: string,
  setFilter: Function,
  sort: string,
  setSort: Function,
  order: string,
  setOrder: Function,
  disabled: Boolean,
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
  const [isOpened, openModal] = useState(false);
  const toggleModal = useCallback(value => () => openModal(value), [openModal]);
  const hasFilters = useMemo(() => filter || (sort && order), [
    filter,
    sort,
    order,
  ]);

  return (
    <>
      <View>
        <Button
          containerStyle={styles.searchBarFilters}
          type="darkSecondary"
          IconLeft={Filters}
          onPress={toggleModal(true)}
          disabled={disabled}
        />
        {hasFilters && <NotifBadge />}
      </View>
      <FilterModalComponent
        isOpened={!disabled && isOpened}
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        order={order}
        setOrder={setOrder}
        onClose={toggleModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  searchBarFilters: {
    width: 38,
    height: 38,
  },
});

export default memo(AppFilter);
