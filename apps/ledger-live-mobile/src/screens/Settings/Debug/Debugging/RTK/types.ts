import { TypedUseSelectorHook, useSelector as useReduxSelector } from "react-redux";
import { State } from "~/reducers/types";

export const useSelector: TypedUseSelectorHook<State> = useReduxSelector;

type RtkQuerySubState = {
  endpointName?: string;
  status?: string;
  requestId?: string;
  originalArgs?: unknown;
  fulfilledTimeStamp?: number;
};

type RtkMutationSubState = {
  endpointName?: string;
  status?: string;
  requestId?: string;
  originalArgs?: unknown;
};

type ApiSlice = {
  queries: Record<string, RtkQuerySubState>;
  mutations: Record<string, RtkMutationSubState>;
};

type QueryEntry = RtkQuerySubState;
type MutationEntry = RtkMutationSubState;

interface ItemProps<T> {
  item: T;
  itemKey: string;
  expanded: boolean;
  toggle: (key: string) => void;
}

interface ApiSectionProps {
  reducerPath: string;
  slice: ApiSlice;
  filter: string;
  expanded: boolean;
  toggleApi: (name: string) => void;
  expandedItems: Record<string, boolean>;
  toggleItem: (key: string) => void;
}

interface SliceSectionProps {
  reducerPath: string;
  slice: unknown;
  filter: string;
  expanded: boolean;
  toggle: (name: string) => void;
}

type Section = "api" | "slice";

export const STATUS_COLORS: Record<string, string> = {
  fulfilled: "success.c50",
  pending: "warning.c50",
  rejected: "error.c50",
  default: "neutral.c70",
};

export type {
  QueryEntry,
  MutationEntry,
  ItemProps,
  ApiSectionProps,
  ApiSlice,
  Section,
  SliceSectionProps,
};
