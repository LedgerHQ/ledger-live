import React, { memo, useState, useCallback } from "react";
import {
  StyleSheet,
  SectionList,
  View,
  TouchableHighlight,
} from "react-native";
import Check from "../../../icons/Check";
import colors from "../../../colors";
import LText from "../../../components/LText";

import ActionModal from "./ActionModal";

const filterSections = [
  {
    title: "Filters",
    data: [
      {
        label: "All",
        value: "ALL",
        isFilter: true,
      },
      {
        label: "Not installed",
        value: "NOT_INSTALLED",
        isFilter: true,
      },
      {
        label: "Live supported",
        value: "LIVE",
        isFilter: true,
      },
    ],
    footerSeparator: true,
  },
  {
    title: "Sort by",
    data: [
      {
        label: "Market Cap",
        value: "MARKET_CAP",
      },
      {
        label: "Name",
        value: "NAME",
      },
      {
        label: "Weight",
        value: "WEIGHT",
      },
      {
        label: "Dependencies",
        value: "DEPENDENCIES",
      },
    ],
  },
];

const keyExtractor = (item, index) => item + index;

const SectionHeader = ({ section: { title } }: *) => (
  <View style={[styles.sectionLine, styles.paddingLine]}>
    <LText style={styles.sectionHeader}>{title}</LText>
  </View>
);

const Separator = ({ section: { footerSeparator } }) =>
  Boolean(footerSeparator) && (
    <View style={styles.paddingLine}>
      <View style={styles.separator} />
    </View>
  );

type Props = {
  isOpened: Boolean,
  onFilter: Function,
  onClose: Function,
};

const FilterModalComponent = ({ isOpened, onFilter, onClose }: Props) => {
  const [selectedFilters, selectFilters] = useState([]);
  const [selectedSort, sortBy] = useState(null);

  const toggleFilter = useCallback(
    value => {
      const filters = [].concat(selectedFilters);
      const index = filters.indexOf(value);

      if (index >= 0) filters.splice(index, 1);
      else filters.push(value);

      selectFilters(filters);
    },
    [selectedFilters, selectFilters],
  );

  const FilterItem = useCallback(({ item: { label, value, isFilter } }) => {
    const isChecked = isFilter
      ? selectedFilters.indexOf(value) >= 0
      : selectedSort === value;

    return (
      <TouchableHighlight
        style={[styles.sectionLine, styles.paddingLine]}
        underlayColor={colors.lightFog}
        onPress={() => (isFilter ? toggleFilter(value) : sortBy(value))}
      >
        <>
          <LText bold={isChecked} style={styles.filterName}>
            {label}
          </LText>
          {Boolean(isChecked) && (
            <View style={styles.checkIcon}>
              <Check color={colors.live} size={14} />
            </View>
          )}
        </>
      </TouchableHighlight>
    );
  });

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
