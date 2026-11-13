import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import React, { memo, useCallback, useEffect, useMemo, useReducer } from "react";
import { Trans } from "~/context/Locale";
import { ListRenderItem, SectionList, SectionListData } from "react-native";
import styled from "styled-components/native";
import Touchable from "~/components/Touchable";

import { BaseButtonProps } from "~/components/Button";
import ActionModal from "./ActionModal";

type FilterSectionData = {
  label: string;
  value: string;
  isFilter?: boolean;
  isDeveloper?: boolean;
};

type FilterSection = {
  title: string;
  data: FilterSectionData[];
  footerSeparator?: boolean;
};

const developerSection: FilterSection = {
  title: "AppAction.developerFilter.title",
  data: [
    { label: "AppAction.developerFilter.all", value: "all", isDeveloper: true },
    { label: "AppAction.developerFilter.ledger", value: "ledger", isDeveloper: true },
    { label: "AppAction.developerFilter.community", value: "community", isDeveloper: true },
  ],
  footerSeparator: true,
};

const filterSections: FilterSection[] = [
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
  height: 48px;
  padding: 12px 0;
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

const keyExtractor = (_item: FilterSectionData, index: number) => "" + index;

const SectionHeader = ({ section: { title } }: { section: SectionListData<FilterSectionData> }) => (
  <Flex alignItems="center" mb={4}>
    <Text variant="h2" fontWeight="medium" color="neutral.c100">
      <Trans i18nKey={title} />
    </Text>
  </Flex>
);

const Separator = ({
  section: { footerSeparator },
}: {
  section: SectionListData<FilterSectionData>;
}) => (footerSeparator ? <SeparatorContainer backgroundColor="neutral.c40" /> : null);

type State = {
  filter: string | null;
  developer: string | null;
  sort: string | null;
  order: string | null;
};

const initialFilterState: State = {
  filter: null,
  developer: null,
  sort: null,
  order: null,
};

type Action = { type: string; payload: string | Partial<State> | null };

const filterReducer = (state: State, { type, payload }: Action): State => {
  switch (type) {
    case "setFilter":
      return { ...state, filter: payload as string };
    case "setDeveloper":
      return { ...state, developer: payload as string };
    case "setSort":
      return { ...state, sort: payload as string };
    case "setOrder":
      return { ...state, order: payload as string };
    case "setState":
      return { ...state, ...(payload as Partial<State>) };
    default:
      return state;
  }
};

type Props = {
  filter: string | null | undefined;
  setFilter: (_: string | null | undefined) => void;
  /** Developer filter section, shown only when setDeveloper is given. */
  developer?: string | null;
  setDeveloper?: (_: string | null | undefined) => void;
  sort: string | null | undefined;
  setSort: (_: string | null | undefined) => void;
  order: string | null | undefined;
  setOrder: (_: string | null | undefined) => void;
  isOpened: boolean;
  onClose: () => void;
};

const FilterModalComponent = ({
  filter,
  setFilter,
  developer,
  setDeveloper,
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
        filter,
        developer: developer ?? null,
        sort,
        order,
      },
    });
  }, [isOpened, filter, developer, sort, order]);

  const onFilter = useCallback(() => {
    setFilter(state.filter);
    setDeveloper?.(state.developer);
    setSort(state.sort);
    setOrder(state.order);
    onClose();
  }, [state, setFilter, setDeveloper, setSort, setOrder, onClose]);

  const sections = useMemo(
    () => (setDeveloper ? [developerSection, ...filterSections] : filterSections),
    [setDeveloper],
  );

  const FilterItem: ListRenderItem<FilterSectionData> = useCallback(
    ({ item }) => {
      const { label, value, isFilter, isDeveloper } = item;
      const isSelected = isDeveloper
        ? state.developer === value
        : isFilter
          ? state.filter === value
          : state.sort === value;
      const isChoice = Boolean(isFilter || isDeveloper);

      let orderValue: string;
      if (state.sort === value) {
        orderValue = state.order === "asc" ? "desc" : "asc";
      } else {
        orderValue = value === "name" ? "asc" : "desc";
      }

      const onPress = () => {
        if (isDeveloper) dispatch({ type: "setDeveloper", payload: value });
        else if (isFilter) dispatch({ type: "setFilter", payload: value });
        else
          dispatch({
            type: "setState",
            payload: { sort: value, order: orderValue },
          });
      };

      return (
        <FilterLine
          style={({ pressed }: { pressed: boolean }) => (pressed ? { opacity: 0.5 } : {})}
          onPress={onPress}
          event="ManagerAppFilterClick"
          eventProperties={{
            value: isDeveloper
              ? `developer_${value}`
              : `${value}${isFilter ? "" : `_${orderValue}`}`,
          }}
        >
          <Text
            variant="body"
            fontWeight="semiBold"
            color={isSelected ? "primary.c80" : "neutral.c100"}
          >
            <Trans i18nKey={label} />
          </Text>
          {isSelected && isChoice && (
            <Flex alignItems="center" justifyContent="center">
              <ArrowIconContainer backgroundColor="primary.c80">
                <IconsLegacy.CheckAloneMedium color="background.main" size={16} />
              </ArrowIconContainer>
            </Flex>
          )}
          {isSelected && !isChoice && (
            <Flex alignItems="center" justifyContent="center" flexDirection="row">
              <ArrowIconContainer
                backgroundColor={state.order === "desc" ? "primary.c80" : "neutral.c60"}
              >
                <IconsLegacy.ArrowBottomMedium color="background.main" size={16} />
              </ArrowIconContainer>
              <ArrowIconContainer
                backgroundColor={state.order !== "desc" ? "primary.c80" : "neutral.c60"}
              >
                <IconsLegacy.ArrowTopMedium color="background.main" size={16} />
              </ArrowIconContainer>
            </Flex>
          )}
        </FilterLine>
      );
    },
    [state],
  );

  const onFilterActions: Partial<BaseButtonProps>[] = [
    // {
    //   title: <Trans i18nKey="AppAction.filter.apply" />,
    //   onPress: onFilter,
    //   type: "primary",
    //   event: "ManagerAppFilterApply",
    //   eventProperties: { values: state },
    // },
  ];

  return (
    <ActionModal isOpened={isOpened} onClose={onFilter} actions={onFilterActions}>
      <SectionList
        style={{ width: "100%" }}
        sections={sections}
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
