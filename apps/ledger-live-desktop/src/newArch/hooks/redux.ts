import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  useStore as useStoreBase,
} from "react-redux";
import type { State } from "~/renderer/reducers";
import type { AppDispatch, ReduxStore } from "~/renderer/createStore";

export const useDispatch = useDispatchBase.withTypes<AppDispatch>();
export const useSelector = useSelectorBase.withTypes<State>();
export const useStore = useStoreBase.withTypes<ReduxStore>();
