/* eslint-disable no-restricted-imports */
import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  useStore as useStoreBase,
} from "react-redux";
import type { State } from "~/reducers/types";
import { store } from "~/state-manager/configureStore";

type AppDispatch = typeof store.dispatch;
type StoreType = typeof store;

export const useDispatch = useDispatchBase.withTypes<AppDispatch>();
export const useSelector = useSelectorBase.withTypes<State>();
export const useStore = useStoreBase.withTypes<StoreType>();
