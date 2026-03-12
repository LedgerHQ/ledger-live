import {
  useDispatch as useDispatchBase,
  useSelector as useSelectorBase,
  useStore as useStoreBase,
} from "react-redux";
import type { State } from "~/renderer/reducers";
import type { AppDispatch, ReduxStore } from "~/state-manager/configureStore";

export const useDispatch = useDispatchBase.withTypes<AppDispatch>();
export const useSelector = useSelectorBase.withTypes<State>();
export const useStore = useStoreBase.withTypes<ReduxStore>();
