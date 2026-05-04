/* eslint-disable no-restricted-imports */
import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  useStore as useStoreBase,
} from "react-redux";
import type { State } from "~/reducers/types";
import { store } from "~/state-manager/configureStore";
import type { AppDispatch } from "~/state-manager/configureStore";

type StoreType = typeof store;

export const useDispatch = useDispatchBase.withTypes<AppDispatch>();
export const useSelector = useSelectorBase.withTypes<State>();
export const useStore = useStoreBase.withTypes<StoreType>();
