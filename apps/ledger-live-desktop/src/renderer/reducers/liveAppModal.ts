import type { State } from "~/renderer/reducers";

export type {
  LiveAppModalParams,
  LiveAppModalState,
} from "@ledgerhq/live-common/wallet-api/LiveAppModal/types";
export {
  setLiveAppModal,
  liveAppModalReducer as default,
} from "@ledgerhq/live-common/wallet-api/LiveAppModal/slice";

export const selectLiveAppModal = (state: Pick<State, "liveAppModal">) => state.liveAppModal;
