import React, { memo, useCallback, useEffect, useReducer } from "react";
import { StyleSheet, SectionList } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import styled from "styled-components/native";
import { Icons, Box, Flex, Text } from "@ledgerhq/native-ui";
import Touchable from "../../../components/Touchable";

import ActionModal from "./ActionModal";

const filterSections = [
  {
    title: "AppAction.filter.title",
    data: [
      {
        label: "AppAction.filter.all",
        value: "all",
        isFilter: true,
      },
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
        label: "AppAction.sort.name",
        value: "name",
      },
      {
        label: "AppAction.sort.marketcap",
        value: "marketcap",
      },
    ],
  },
];

const FilterLine = styled(Touchable)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 48;
  padding-vertical: 12;
`;

const ArrowIconContainer = styled(Flex).attrs({
  alignItems: "center",
  justifyContent: "center",
  padding: 2,
  borderRadius: 50,
  marginLeft: 4,
})``;

const SeparatorContainer = styled(Flex).attrs({
  width: "100%",
  height: 1,
  marginVertical: 32,
})``;

const keyExtractor = (item, index) => item + index;

const SectionHeader = ({ section: { title } }: any) => (
  <Flex alignItems="center" mb={4}>
    <Text variant="h2" fontWeight="medium" color="neutral.c100">
      <Trans i18nKey={title} />
    </Text>
  </Flex>
);

const Separator = ({ section: { footerSeparator } }: any) =>
  footerSeparator ? <SeparatorContainer backgroundColor="neutral.c40" /> : null;

const initialFilterState = {
  filters: null,
  sort: null,
  order: null,
};

const filterReducer = (state, { type, payload }) => {
  switch (type) {
    case "setFilter":
      return { ...state, filter: payload };
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
  filter: string;
  setFilter: (filter: string | null | undefined) => void;
  sort: string;
  setSort: () => void;
  order: string;
  setOrder: () => void;
  isOpened: Boolean;
  onClose: () => void;
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
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  const { colors } = useTheme();

  useEffect(() => {
    dispatch({
      type: "setState",
      payload: {
        filter,
        sort,
        order,
      },
    });
  }, [isOpened, filter, sort, order]);

  const onFilter = useCallback(() => {
    setFilter(state.filter);
    setSort(state.sort);
    setOrder(state.order);
    onClose();
  }, [state, setFilter, setSort, setOrder, onClose]);

  const FilterItem = useCallback(
    ({ item: { label, value, isFilter } }) => {
      const isSelected = isFilter
        ? state.filter === value
        : state.sort === value;

      let orderValue: string;
      if (state.sort === value) {
        orderValue = state.order === "asc" ? "desc" : "asc";
      } else {
        orderValue = value === "name" ? "asc" : "desc";
      }

      const onPress = () => {
        if (isFilter) dispatch({ type: "setFilter", payload: value });
        else
          dispatch({
            type: "setState",
            payload: { sort: value, order: orderValue },
          });
      };

      return (
        <FilterLine
          activeOpacity={0.5}
          onPress={onPress}
          event="ManagerAppFilterClick"
          eventProperties={{
            value: `${value}${isFilter ? "" : `_${orderValue}`}`,
          }}
        >
          <Text
            variant="body"
            fontWeight="semiBold"
            color={isSelected ? "primary.c80" : "neutral.c100"}
          >
            <Trans i18nKey={label} />
          </Text>
          {Boolean(isSelected) && Boolean(isFilter) && (
            <Flex alignItems="center" justifyContent="center">
              <ArrowIconContainer backgroundColor="primary.c80">
                <Icons.CheckAloneMedium color="background.main" size={16} />
              </ArrowIconContainer>
            </Flex>
          )}
          {Boolean(isSelected) && !isFilter && (
            <Flex
              alignItems="center"
              justifyContent="center"
              flexDirection="row"
            >
              <ArrowIconContainer
                backgroundColor={
                  state.order === "desc" ? "primary.c80" : "neutral.c60"
                }
              >
                <Icons.ArrowBottomMedium color="background.main" size={16} />
              </ArrowIconContainer>
              <ArrowIconContainer
                backgroundColor={
                  state.order !== "desc" ? "primary.c80" : "neutral.c60"
                }
              >
                <Icons.ArrowTopMedium color="background.main" size={16} />
              </ArrowIconContainer>
            </Flex>
          )}
        </FilterLine>
      );
    },
    [state],
  );

  const onFilterActions = [
    // {
    //   title: <Trans i18nKey="AppAction.filter.apply" />,
    //   onPress: onFilter,
    //   type: "primary",
    //   event: "ManagerAppFilterApply",
    //   eventProperties: { values: state },
    // },
  ];

  return (
    <ActionModal
      isOpened={isOpened}
      onClose={onFilter}
      actions={onFilterActions}
    >
      <SectionList
        style={{ width: "100%" }}
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

export default memo(FilterModalComponent);
