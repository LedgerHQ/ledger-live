import React, { memo, useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  SectionList,
  View,
  TouchableHighlight,
} from "react-native";
import { Trans } from "react-i18next";
import Check from "../../../icons/Check";
import colors from "../../../colors";
import LText from "../../../components/LText";

import ActionModal from "./ActionModal";

const filterSections = [
  {
    title: "AppAction.filter.title",
    data: [
      // {
      //   label: "AppAction.filter.all",
      //   value: "all",
      //   isFilter: true,
      // },
      {
        label: "AppAction.filter.installed",
        value: "installed",
        isFilter: true,
      },
      {
        label: "AppAction.filter.not_installed",
        value: "not_installed",
        isFilter: true,
      },
      {
        label: "AppAction.filter.supported",
        value: "supported",
        isFilter: true,
      },
      {
        label: "AppAction.filter.updatable",
        value: "updatable",
        isFilter: true,
      },
    ],
    footerSeparator: true,
  },
  {
    title: "AppAction.sort.title",
    data: [
      // {
      //   label: "AppAction.sort.default",
      //   value: "default",
      // },
      {
        label: "AppAction.sort.name_asc",
        value: "name",
        orderValue: "asc",
      },
      {
        label: "AppAction.sort.name_desc",
        value: "name",
        orderValue: "desc",
      },
      {
        label: "AppAction.sort.marketcap_desc",
        value: "marketcap",
        orderValue: "desc",
      },
      {
        label: "AppAction.sort.marketcap_asc",
        value: "marketcap",
        orderValue: "asc",
      },
    ],
  },
];

const keyExtractor = (item, index) => item + index;

const SectionHeader = ({ section: { title } }: *) => (
  <View style={[styles.sectionLine, styles.paddingLine]}>
    <LText style={styles.sectionHeader}>
      <Trans i18nKey={title} />
    </LText>
  </View>
);

const Separator = ({ section: { footerSeparator } }) =>
  Boolean(footerSeparator) && (
    <View style={styles.paddingLine}>
      <View style={styles.separator} />
    </View>
  );

type Props = {
  filter: string,
  setFilter: Function,
  sort: string,
  setSort: Function,
  order: string,
  setOrder: Function,
  isOpened: Boolean,
  onClose: Function,
};

const FilterModalComponent = ({
  filter,
  setFilter,
  sort,
  setSort,
  order,
  setOrder,
  isOpened,
  onClose,
}: Props) => {
  const [selectedFilters, filterBy] = useState();
  const [selectedSort, sortBy] = useState();
  const [selectedOrder, orderBy] = useState();

  useEffect(() => {
    filterBy(filter);
    sortBy(sort);
    orderBy(order);
  }, [isOpened, filter, sort, order]);

  /** 
   const toggleFilter = useCallback(
    value => {
      const filters = [].concat(selectedFilters);
      const index = filters.indexOf(value);

      if (index >= 0) filters.splice(index, 1);
      else filters.push(value);

      filterBy(filters);
    },
    [selectedFilters, filterBy],
  );
  */

  const onFilter = useCallback(() => {
    setFilter(selectedFilters);
    setSort(selectedSort);
    setOrder(selectedOrder);
    onClose();
  }, [
    selectedFilters,
    setFilter,
    selectedSort,
    setSort,
    setOrder,
    selectedOrder,
    onClose,
  ]);

  const FilterItem = useCallback(
    ({ item: { label, value, isFilter, orderValue } }) => {
      const isChecked = isFilter
        ? selectedFilters === value
        : selectedSort === value && orderValue === selectedOrder;

      const onPress = () => {
        const newValue = isChecked ? null : value;
        if (isFilter) filterBy(newValue);
        else {
          sortBy(newValue);
          orderBy(isChecked ? null : orderValue);
        }
      };

      return (
        <TouchableHighlight
          style={[styles.sectionLine, styles.paddingLine]}
          underlayColor={colors.lightFog}
          onPress={onPress}
        >
          <>
            <LText bold={isChecked} style={styles.filterName}>
              <Trans i18nKey={label} />
            </LText>
            {Boolean(isChecked) && (
              <View style={styles.checkIcon}>
                <Check color={colors.live} size={14} />
              </View>
            )}
          </>
        </TouchableHighlight>
      );
    },
    [selectedFilters, selectedSort, selectedOrder],
  );

  const onFilterActions = [
    {
      title: "Apply",
      onPress: onFilter,
      type: "primary",
    },
  ];

  return (
    <ActionModal
      isOpened={isOpened}
      onClose={onClose}
      actions={onFilterActions}
    >
      <SectionList
        style={styles.list}
        sections={filterSections}
        keyExtractor={keyExtractor}
        renderItem={FilterItem}
        renderSectionHeader={SectionHeader}
        renderSectionFooter={Separator}
      />
    </ActionModal>
  );
};

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  sectionLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 41,
    paddingVertical: 12,
  },
  sectionHeader: {
    fontSize: 11,
    color: colors.grey,
    textTransform: "uppercase",
  },
  filterName: {
    fontSize: 14,
  },
  paddingLine: {
    paddingHorizontal: 20,
  },
  checkIcon: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: colors.lightFog,
  },
});

export default memo(FilterModalComponent);
