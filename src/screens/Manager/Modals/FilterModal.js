import React, { memo, useCallback, useEffect, useReducer } from "react";
import { StyleSheet, SectionList, View } from "react-native";
import { Trans } from "react-i18next";
import Check from "../../../icons/Check";
import colors from "../../../colors";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";

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
      // {
      //   label: "AppAction.filter.installed",
      //   value: "installed",
      //   isFilter: true,
      // },
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
      // {
      //   label: "AppAction.filter.updatable",
      //   value: "updatable",
      //   isFilter: true,
      // },
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

const initialFilterState = {
  filters: null,
  sort: null,
  order: null,
};

const filterReducer = (state, { type, payload }) => {
  switch (type) {
    case "setFilters":
      return { ...state, filters: payload };
    case "toggleFilter": {
      const filters = [].concat(state.filters);

      const i = filters.indexOf(payload);

      if (i >= 0) filters.splice(i, 1);
      else filters.push(payload);

      return { ...state, filters };
    }
    case "setSort":
      return { ...state, sort: payload };
    case "setOrder":
      return { ...state, order: payload };
    case "setState":
      return { ...state, ...payload };
    default:
      return state;
  }
};

type Props = {
  filters: string[],
  setFilters: () => void,
  sort: string,
  setSort: () => void,
  order: string,
  setOrder: () => void,
  isOpened: Boolean,
  onClose: () => void,
};

const FilterModalComponent = ({
  filters,
  setFilters,
  sort,
  setSort,
  order,
  setOrder,
  isOpened,
  onClose,
}: Props) => {
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);

  useEffect(() => {
    dispatch({
      type: "setState",
      payload: {
        filters,
        sort,
        order,
      },
    });
  }, [isOpened, filters, sort, order]);

  const onFilter = useCallback(() => {
    setFilters(state.filters);
    setSort(state.sort);
    setOrder(state.order);
    onClose();
  }, [state, setFilters, setSort, setOrder, onClose]);

  const FilterItem = useCallback(
    ({ item: { label, value, isFilter, orderValue } }) => {
      const isChecked = isFilter
        ? state.filters.includes(value)
        : state.sort === value && state.order === orderValue;

      const onPress = () => {
        if (isFilter) dispatch({ type: "toggleFilter", payload: value });
        else
          dispatch({
            type: "setState",
            payload: { sort: value, order: orderValue },
          });
      };

      return (
        <Touchable
          style={[styles.sectionLine, styles.paddingLine]}
          activeOpacity={0.5}
          onPress={onPress}
          event="ManagerAppFilterClick"
          eventProperties={{
            value: `${value}${isFilter ? "" : `_${orderValue}`}`,
          }}
        >
          <LText bold={isChecked} style={styles.filterName}>
            <Trans i18nKey={label} />
          </LText>
          {Boolean(isChecked) && (
            <View style={styles.checkIcon}>
              <Check color={colors.live} size={14} />
            </View>
          )}
        </Touchable>
      );
    },
    [state],
  );

  const onFilterActions = [
    {
      title: <Trans i18nKey="AppAction.filter.apply" />,
      onPress: onFilter,
      type: "primary",
      event: "ManagerAppFilterApply",
      eventProperties: { values: state },
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
        bounces={false}
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
    backgroundColor: colors.white,
  },
  sectionHeader: {
    fontSize: 12,
    color: colors.grey,
    textTransform: "uppercase",
  },
  filterName: {
    fontSize: 14,
    lineHeight: 17,
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
    marginVertical: 16,
  },
});

export default memo(FilterModalComponent);
