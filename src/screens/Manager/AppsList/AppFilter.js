import React, { memo, useState, useCallback } from "react";
import { StyleSheet } from "react-native";

import { Action } from "@ledgerhq/live-common/lib/apps";

import Filters from "../../../icons/Filters";
import Button from "../../../components/Button";

import FilterModalComponent from "../Modals/FilterModal";

type Props = {
  dispatch: Action => void,
  disabled: Boolean,
};

const AppFilter = ({ dispatch, disabled }: Props) => {
  const [isOpened, openModal] = useState(false);
  const toggleModal = useCallback(value => () => openModal(value), [openModal]);

  return (
    <>
      <Button
        containerStyle={styles.searchBarFilters}
        type="darkSecondary"
        IconLeft={Filters}
        onPress={toggleModal(true)}
        disabled={disabled}
      />
      <FilterModalComponent
        isOpened={!disabled && isOpened}
        onClose={toggleModal(false)}
        onFilter={toggleModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  searchBarFilters: {
    width: 40,
    height: 38,
    marginLeft: 10,
  },
});

export default memo(AppFilter);
