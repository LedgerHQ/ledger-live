import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  useStore as useStoreBase,
} from "react-redux";
import type { State } from "~/reducers/types";
import type { store } from "./store";

type AppDispatch = typeof store.dispatch;
type StoreType = typeof store;

export const useDispatch = useDispatchBase.withTypes<AppDispatch>();
export const useSelector = useSelectorBase.withTypes<State>();
export const useStore = useStoreBase.withTypes<StoreType>();
